<?php

/**
 * @file Contains the variables and defaults used by DXMPP.
 */
define('DXMPP_VARIABLE_NAMESPACE', 'dxmpp__');

/**
 * Presence status constants.
 */
define('DXMPP_STATUS_INVISIBLE', 3);
define('DXMPP_STATUS_ONLINE', 2);
define('DXMPP_STATUS_AWAY', 1);
define('DXMPP_STATUS_UNAVAILABLE', 0);

/**
 *  Wrapper for variable_get() that uses the Dxmpp variable registry.
 *
 *  @param string $name
 *    The variable name to retrieve. Note that it will be namespaced by
 *    pre-pending DXMPP_VARIABLE_NAMESPACE, as to avoid variable collisions with
 *    other modules.
 *  @param unknown $default
 *    An optional default variable to return if the variable hasn't been set
 *    yet. Note that within this module, all variables should already be set
 *    in the dxmpp_variable_default() function.
 *  @return unknown
 *    Returns the stored variable or its default.
 *
 *  @see dxmpp_variable_set()
 *  @see dxmpp_variable_del()
 *  @see dxmpp_variable_default()
 */
function dxmpp_variable_get($name, $default = NULL) {
  // Allow for an override of the default.
  // Useful when a variable is required (like $path), but namespacing still desired.
  if (!isset($default)) {
    $default = dxmpp_variable_default($name);
  }
  // Namespace all variables
  $variable_name = DXMPP_VARIABLE_NAMESPACE . $name;
  return variable_get($variable_name, $default);
}

/**
 *  Wrapper for variable_set() that uses the Dxmpp variable registry.
 *
 *  @param string $name
 *    The variable name to set. Note that it will be namespaced by
 *    pre-pending DXMPP_VARIABLE_NAMESPACE, as to avoid variable collisions with
 *    other modules.
 *  @param unknown $value
 *    The value for which to set the variable.
 *  @return unknown
 *    Returns the stored variable after setting.
 *
 *  @see dxmpp_variable_get()
 *  @see dxmpp_variable_del()
 *  @see dxmpp_variable_default()
 */
function dxmpp_variable_set($name, $value) {
  $variable_name = DXMPP_VARIABLE_NAMESPACE . $name;
  return variable_set($variable_name, $value);
}

/**
 *  Wrapper for variable_del() that uses the Dxmpp variable registry.
 *
 *  @param string $name
 *    The variable name to delete. Note that it will be namespaced by
 *    pre-pending DXMPP_VARIABLE_NAMESPACE, as to avoid variable collisions with
 *    other modules.
 *
 *  @see dxmpp_variable_get()
 *  @see dxmpp_variable_set()
 *  @see dxmpp_variable_default()
 */
function dxmpp_variable_del($name) {
  $variable_name = DXMPP_VARIABLE_NAMESPACE . $name;
  variable_del($variable_name);
}

/**
 *  The default variables within the Dxmpp namespace.
 *
 *  @param string $name
 *    Optional variable name to retrieve the default. Note that it has not yet
 *    been pre-pended with the DXMPP_VARIABLE_NAMESPACE namespace at this time.
 *  @return unknown
 *    The default value of this variable, if it's been set, or NULL, unless
 *    $name is NULL, in which case we return an array of all default values.
 *
 *  @see dxmpp_variable_get()
 *  @see dxmpp_variable_set()
 *  @see dxmpp_variable_del()
 */
function dxmpp_variable_default($name = NULL) {
  static $defaults;

  if (!isset($defaults)) {
    $defaults = array(
      'domain' => '',
      'server' => '',
      'port' => 5222,
      'strophe_path' => '',
      'use_flxhr' => TRUE,
      'flxhr_path' => '',
      'use_jquery_cycle' => TRUE,
      'jquery_cycle_path' => '',
      'use_dxmpp_auth' => FALSE,
      'register_locally' => TRUE,
      'roster_empty_message' => 'You currently have no friends online.',
      'help_path' => '',
      'icon_imagecache' => '',
      'icon_width' => 27,
      'icon_height' => 27,
      'text_friends_singular' => '<span>1</span> friend online',
      'text_friends_plural' => '<span>@count</span> friends online',
      'admin_username' => '',
      'admin_password' => '',
      'callback_frequency' => 2,
      'runtime' => 3,
      'disable_on_bad_browser' => FALSE,
      'disable_on_bad_browser_message_title' => 'Chat disabled',
      'disable_on_bad_browser_message' => "We're sorry, but for technical reasons, the chat is currently disabled for Microsoft Internet Explorer 6. Please upgrade to a more modern browser.",
      'no_js_message' => 'Enable JavaScript to chat',
      'use_jquery_cycle' => FALSE,
      'number_of_tabs_in_cycle' => 3,
      'display_typing_message' => TRUE,
      'typing_message' => '@name is typing...',
      'theme' => 0,
      'use_audio_alert' => 0,
      'jplayer_path' => '',
      'jplayer_filename' => '',
    );
  }

  if (!isset($name)) {
    return $defaults;
  }

  if (isset($defaults[$name])) {
    return $defaults[$name];
  }
}

function dxmpp_variable_name($name) {
  return DXMPP_VARIABLE_NAMESPACE . $name;
}

