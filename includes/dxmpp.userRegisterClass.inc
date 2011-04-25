<?php

class dxmppUserRegister {
  // The jabber connection.
  public $conn;

  // DB record fields.
  public $uid;
  public $xmpp_username;
  public $xmpp_password;
  public $delete_on_cron;

  // Set to TRUE if successful.
  public $registered;

  function __construct($uid, $xmpp_username, $xmpp_password) {
    $this->uid = $uid;
    $this->xmpp_username = $xmpp_username;
    $this->xmpp_password = $xmpp_password;
    $this->delete_on_cron = FALSE;
    $this->registered = FALSE;

    // Create an instance of the Jabber class.
    $display_debug_info = TRUE;
    $this->conn = new Jabber($display_debug_info);

    $this->conn->set_handler("connected", $this, "handleConnected");
    $this->conn->set_handler("registered", $this, "handleRegistered");
    $this->conn->set_handler("error", $this, "handleError");
    $this->conn->set_handler("debug_log", $this, "handleDebug");
    $this->conn->set_handler("regfailure", $this, "handleRegFailure");

    if (!$this->conn->connect(dxmpp_variable_get('domain'), dxmpp_variable_get('port'), dxmpp_variable_get('runtime'))) {
      $message = "Unable to connect to XMPP for registration attempt of %xmpp_username.";
      $vars = array('%xmpp_username' => $this->xmpp_username);
//       drupal_set_message(t($message, $vars), 'error');
      watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);
    }
    else {
      // Now, tell the Jabber class to begin its execution loop.
      $this->conn->execute(dxmpp_variable_get('callback_frequency'), dxmpp_variable_get('runtime'));

      // Note that we will not reach this point (and the execute() method will not
      // return) until $jab->terminated is set to TRUE.  The execute() method simply
      // loops, processing data from (and to) the Jabber server, and firing events
      // (which are handled by our TestMessenger class) until we tell it to terminate.

      // Disconnect from the Jabber server.
      $this->conn->disconnect();
    }
  }

  function handleDebug($msg,$level) {
//     drupal_set_message(t('Debug (%level): %msg', array('%msg' => $msg, '%level' => $level)));
  }

  // Called when an error is received from the Jabber server.
  function handleError($code, $error, $xmlns) {
    $error = is_string($msg) ? $error : '';
    $message = 'Unknown error during registration attempt for %xmpp_username: %error (%code)';
    $vars = array('%error' => $error, '%code' => $code, '%xmpp_username' => $this->xmpp_username);
    if ($xmlns) {
      $message .= ', in %xmlns';
      $vars['%xmlns'] = $xmlns;
    }
//     drupal_set_message(t($message, $vars), 'error');
    watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);
    $this->conn->terminated = TRUE;
  }

  function handleConnected() {
    $this->conn->register($this->xmpp_username, $this->xmpp_password);
  }

  function handleRegistered($jid) {
    $message = 'Registered XMPP xmpp_username: %xmpp_username.';
    $vars = array('%xmpp_username' => $jid);
//     drupal_set_message(t($message, $vars));
    watchdog('dxmpp', $message, $vars);
    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = TRUE;
    $this->registered = TRUE;
  }

  function handleRegFailure($code, $msg) {
    $msg = is_string($msg) ? $msg : '';
    $message = '(%code) Unable to register %xmpp_username : %msg';
    switch ($code) {
      case 403:
        $message .= ' Please configure the XMPP server to allow the registration of new users. See <a href="@url">Setting up an XMPP server for use with Drupal</a> for more info.';
        break;
        
      //User is already registered on server but we need to check whether this registration has been done by us
      case -1:
        $new_con = new dxmppUserConnect($this->xmpp_username, $this->xmpp_password);
        if($new_con->authenticated) {
        	$this->registered = TRUE;
        }
        break;
    }
    $vars = array('%xmpp_username' => $this->xmpp_username, '%code' => $code, '%msg' => $msg, '@url' => url('http://groups.drupal.org/node/59163'));
//     drupal_set_message(t($message, $vars), 'error');
    if ($code != -1) {
      watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);
    }
    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = TRUE;
  }
}
