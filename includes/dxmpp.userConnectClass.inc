<?php

class dxmppUserConnect {
  // The jabber connection.
  public $conn;

  // DB record fields.
  public $xmpp_username;
  public $xmpp_password;

  public $xmpp_rid;
  public $xmpp_sid;
  public $xmpp_domain;
  public $xmpp_route;

  // Set to TRUE if successful.
  public $registered;
  
  //Set to TRUE if successfully authenticated.
  public $authenticated;

  function __construct($xmpp_username, $xmpp_password, $xmpp_rid = NULL) {
    $this->xmpp_username = $xmpp_username;
    $this->xmpp_password = $xmpp_password;
    $this->xmpp_rid = $xmpp_rid;
    $this->xmpp_domain = dxmpp_variable_get('domain');
    $this->xmpp_route = dxmpp_variable_get('server');
	$this->authenticated = FALSE;
    
    // Create an instance of the Jabber class.
    $display_debug_info = TRUE;
    $this->conn = new Jabber($display_debug_info);

    $this->conn->set_handler("connected", $this, "handleConnected");
    $this->conn->set_handler("authenticated", $this, "handleAuthenticated");
    $this->conn->set_handler("authfailure", $this, "handleAuthFailure");
//     $this->conn->set_handler("registered", $this, "handleRegistered");
    $this->conn->set_handler("error", $this, "handleError");
    $this->conn->set_handler("debug_log", $this, "handleDebug");
//     $this->conn->set_handler("regfailure", $this, "handleRegFailure");

    if (!$this->conn->connect($this->xmpp_domain)) {
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
    $error = is_string($error) ? $error : '';
    $message = 'Unknown error during connection attempt for %xmpp_username: %error (%code)';
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
    $this->conn->login($this->xmpp_username, $this->xmpp_password);
//     $this->conn->register($this->xmpp_username, $this->xmpp_password);
  }

  // Called after a login to indicate the the login was successful.
  function handleAuthenticated() {
    //function message($to, $type = "normal", $id = NULL, $body = NULL, $thread = NULL, $subject = NULL, $payload = NULL, $raw = false) {
//     $this->conn->message(dxmpp_variable_get('domain'), );
    $rid = $this->xmpp_rid;
    $domain = $this->xmpp_domain;
    $route = $this->xmpp_route;
    $xml = <<<XML
      <body content='text/xml; charset=utf-8'
      hold='1'
      rid='$rid'
      to='$domain'
      route='$route'
      ver='1.6'
      wait='3'
      ack='1'
      xml:lang='en'
      xmlns='http://jabber.org/protocol/httpbind'/>
XML;
    $this->xmpp_response = $this->conn->_send($xml);

    $this->xmpp_body = $this->conn->_node($this->xmpp_response, array('message', '#', 'body', 0, '#'));

    // @TODO: We actually want to handle the response and grab 'sid' from the body.
    $this->conn->terminated = TRUE;
    $this->authenticated = TRUE;
  }

  // Called after a login to indicate that the login was NOT successful.
  function handleAuthFailure($code, $error) {
    $error = is_string($error) ? $error : '';
    $message = "XMPP authentication failure during authentication attempt for %username: %error (%code).";
    $vars = array('%error' => $error, '%code' => $code, '%username' => $this->username);
    drupal_set_message(t($message, $vars), 'error');
    watchdog('dxmpp', $message, $vars, WATCHDOG_ERROR);

    // set terminated to TRUE in the Jabber class to tell it to exit
    $this->conn->terminated = true;
  }
}
