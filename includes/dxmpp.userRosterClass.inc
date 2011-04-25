<?php

class dxmppUserRoster {
  // The jabber connection.
  public $conn;
  public $username;
  public $password;

  function __construct($username, $password, $friend, $add = TRUE, $group = NULL) {
    $this->username = $username;
    $this->password = $password;
    $this->friend = $friend;
    $this->rosterUpdated = FALSE;
    $this->group = $group;
    $this->friend_jid = $friend .'@'. dxmpp_variable_get('domain');
    $this->add = $add;

    // Create an instance of the Jabber class.
    $display_debug_info = TRUE;
    $this->conn = new Jabber($display_debug_info);

    $this->conn->set_handler("connected", $this, "handleConnected");
    $this->conn->set_handler("authenticated", $this, "handleAuthenticated");
    $this->conn->set_handler("authfailure", $this, "handleAuthFailure");

//     $this->conn->set_handler("subscribe", $this, "handleSubscribe");
//     $this->conn->set_handler("subscribed", $this, "handlesubscribed");

    $this->conn->set_handler("rosteradded", $this, "handleRosterAdded");
    $this->conn->set_handler("rosteraddfailure", $this, "handleRosterAddFailure");
    $this->conn->set_handler("rosterremoveded", $this, "handleRosterRemoved");
    $this->conn->set_handler("rosterremovefailure", $this, "handleRosterRemoveFailure");
    $this->conn->set_handler("error", $this, "handleError");
    $this->conn->set_handler("debug_log", $this, "handleDebug");

    if (!$this->conn->connect(dxmpp_variable_get('domain'))) {
      $message = "Unable to connect to XMPP for roster attempt of %username.";
      $vars = array('%username' => $this->username);
      drupal_set_message(t($message, $vars), 'error');
      watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);
    }
    else {
      // Now, tell the Jabber class to begin its execution loop.
      $this->conn->execute(dxmpp_variable_get('callback_frequency'), dxmpp_variable_get('runtime'));

      // Note that we will not reach this point (and the execute() method will not
      // return) until $jab->terminated is set to TRUE.  The execute() method simply
      // loops, processing data from (and to) the Jabber server, and firing events
      // (which are handled by our TestMessenger class) until we tell it to terminate.
      //
      // This event-based model will be familiar to programmers who have worked on
      // desktop applications, particularly in Win32 environments.

      // Disconnect from the Jabber server.
      $this->conn->disconnect();
    }
  }

  function handleDebug($msg,$level) {
//     drupal_set_message(t('Debug (%level): %msg', array('%msg' => $msg, '%level' => $level)));
  }

  // Called after a login to indicate that the login was NOT successful.
  function handleAuthFailure($code, $error) {
    $error = is_string($error) ? $error : '';
    $message = "XMPP authentication failure during registration attempt for %username: %error (%code).";
    $vars = array('%error' => $error, '%code' => $code, '%username' => $this->username);
    drupal_set_message(t($message, $vars), 'error');
    watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);

    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = true;
  }

  // Called when an error is received from the Jabber server.
  function handleError($code, $error, $xmlns) {
    $error = is_string($error) ? $error : '';
    $message = 'Unknown error during registration attempt for %username: %error (%code)';
    $vars = array('%error' => $error, '%code' => $code, '%username' => $this->username);
    if ($xmlns) {
      $message .= ', in %xmlns';
      $vars['%xmlns'] = $xmlns;
    }
    drupal_set_message(t($message, $vars), 'error');
    watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);
    $this->conn->terminated = true;
  }

  function handleConnected() {
    $this->conn->login($this->username, $this->password);
  }

  // Called after a login to indicate the the login was successful.
  function handleAuthenticated() {
    if ($this->add) {
      $this->conn->add_contact($this->friend_jid, $this->friend, $this->group);
    }
    else {
      $this->conn->remove_contact($this->friend_jid);
    }
  }

  function handleRosterAdded($jid) {
    $message = 'Added friend: %friend to roster for XMPP user: %username.';
    $vars = array('%username' => $this->username, '%friend' => $this->friend);
    drupal_set_message(t($message, $vars));
    watchdog('dxmpp', $message, $vars);
    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = true;
    $this->rosterUpdated = TRUE;
  }

  function handleRosterAddFailure($code, $msg) {
    $msg = is_string($msg) ? $msg : '';
    $message = 'Unable to add friend: %friend to roster of XMPP user: %username (%code): %msg.';
    $vars = array('%username' => $this->username, '%code' => $code, '%msg' => $msg, '%friend' => $this->friend);
    drupal_set_message(t($message, $vars), 'error');
    watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);
    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = true;
  }

  function handleRosterRemoved() {
    $message = 'Removed friend: %friend from roster for XMPP user: %username.';
    $vars = array('%username' => $this->username, '%friend' => $this->friend);
    drupal_set_message(t($message, $vars));
    watchdog('dxmpp', $message, $vars);
    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = true;
    $this->rosterUpdated = TRUE;
  }

  function handleRosterRemoveFailure($code, $msg) {
    $msg = is_string($msg) ? $msg : '';
    $message = 'Unable to remove friend: %friend from roster of XMPP user: %username (%code): "%msg".';
    $vars = array('%username' => $this->username, '%code' => $code, '%msg' => $msg, '%friend' => $this->friend);
    drupal_set_message(t($message, $vars), 'error');
    watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);
    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = true;
  }
}
