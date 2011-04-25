<?php

/**
 * @file
 * Implementations of token module hooks for the dxmpp module.
 */

/**
 * Implementation of hook_token_values().
 */
function dxmpp_token_values($type, $object = NULL, $options = array()) {
  $values = array();
  switch ($type) {
    case 'user':
      global $user;
      dxmpp_user_load($user);
      $account = $user;
      $values['dxmpp-username'] = $account->uid ? $account->dxmpp->xmpp_username : NULL;
      $values['dxmpp-password'] = $account->uid ? $account->dxmpp->xmpp_password : NULL;

      break;

    case 'global':
      $values['dxmpp-domain'] = dxmpp_variable_get('domain');
      $values['dxmpp-server'] = dxmpp_variable_get('server');
      $values['dxmpp-port'] = dxmpp_variable_get('port');
      $values['dxmpp-runtime'] = dxmpp_variable_get('runtime');
      $values['dxmpp-callback'] = dxmpp_variable_get('callback');

      break;
  }
  return $values;
}

/**
 * Implementation of hook_token_list().
 */
function dxmpp_token_list($type = 'all') {
  if ($type == 'user' || $type == 'all') {
    $tokens['user']['dxmpp-username'] = t("XMPP Username");
    $tokens['user']['dxmpp-password'] = t("XMPP Password");
  }
  if ($type == 'global' || $type == 'all') {
    $tokens['global']['dxmpp-domain'] = t("It is the domain for your XMPP server, which is used to authenticate XMPP users.");
    $tokens['global']['dxmpp-server'] = t("It is the BOSH URL of the XMPP server, which is used for the browser to communicate with the XMPP server.");
    $tokens['global']['dxmpp-port'] = t("It is the XMPP port for the Drupal server to communicate with the XMPP server.");
    $tokens['global']['dxmpp-runtime'] = t("It is the number of seconds to run an XMPP request from the web.");
    $tokens['global']['dxmpp-callback'] = t("It is the number of times to call an XMPP request per second from the web.");
  }

  return $tokens;
}
