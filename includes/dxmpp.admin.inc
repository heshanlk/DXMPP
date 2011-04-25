<?php

/**
 * @file
 * Administrative functions to configure DXMPP.
 */

/**
 * Callback for admin/settings/dxmpp.
 */
function dxmpp_settings_form() {
  // Autodiscover the path to the various supported libraries.
  dxmpp_strophe_path();
  dxmpp_flxhr_path();
  dxmpp_jquery_cycle_path();
  dxmpp_jplayer_path();
  // Alert the administrator to still required items for basic functionality.
  if (!dxmpp_variable_get('domain')) {
    drupal_set_message(t("You must enter the XMPP Server domain in the %info section.", array('%info' => t('Server info'))), 'error');
  }
  if (!dxmpp_variable_get('server')) {
    drupal_set_message(t("You must enter the XMPP Bosh URL to the XMPP in the %info section.", array('%info' => t('Server info'))), 'error');
  }
  if (!dxmpp_variable_get('strophe_path')) {
    drupal_set_message(t("You must !download, and place its entire contents into %libraries.", array('!download' => l(t('download and extract the Strophe library'), 'http://code.stanziq.com/strophe/', array('attributes' => array('target' => '_blank'))), '%libraries' => 'sites/all/libraries')), 'error');
  }
  
  $form = array();

  $form['server_info'] = array(
    '#type' => 'fieldset',
    '#title' => t('Server info'),
    '#collapsible' => TRUE,
  );
  $form['server_info'][dxmpp_variable_name('domain')] = array(
    '#type' => 'textfield',
    '#title' => t('XMPP Server domain'),
    '#description' => t('Please enter the domain for your XMPP server, which is used to authenticate XMPP users. For instance, you might enter %example.', array('%example' => 'xmpp.example.com')),
    '#default_value' => dxmpp_variable_get('domain'),
  );
  $form['server_info'][dxmpp_variable_name('server')] = array(
    '#type' => 'textfield',
    '#title' => t('XMPP Bosh URL'),
    '#description' => t("Please enter the BOSH URL of the XMPP server, which is used for the browser to communicate with the XMPP server. For instance, you might use %example or %other. Unless you are using the !flXHR browser cross-domain tool (see below), you will probably need to set up a reverse proxy. Please read the !documentation for further assistance.", array('%example' => 'http://jabber.example.com/http-bind/', '%other' => 'http://xmpp.example.com:5280/http-bind/', '!flXHR' => l(t('flXHR'), 'http://flxhr.flensed.com/', array('attributes' => array('target' => '_blank'))), '!documentation' => l(t('online documentation'), 'http://drupal.org/project/dxmpp', array('attributes' => array('target' => '_blank'))))),
    '#default_value' => dxmpp_variable_get('server'),
  );
  $form['server_info']['advanced'] = array(
    '#type' => 'fieldset',
    '#title' => t('Advanced settings'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );
  $form['server_info']['advanced'][dxmpp_variable_name('port')] = array(
    '#type' => 'textfield',
    '#title' => t('XMPP port'),
    '#description' => t("Please enter the XMPP port for the Drupal server to communicate with the XMPP server. Note that this is not the same as the Bosh port. It's unlikely you need to change this value."),
    '#default_value' => dxmpp_variable_get('port'),
  );
  $form['server_info']['advanced'][dxmpp_variable_name('runtime')] = array(
    '#type' => 'textfield',
    '#title' => t('Runtime'),
    '#description' => t("Please enter the the number of seconds to run an XMPP request from the web. This is used for registration, roster synchronization, and other purposes. You probably don't want to change this number unless you're experiencing connection problems."),
    '#default_value' => dxmpp_variable_get('runtime'),
  );
  $form['server_info']['advanced'][dxmpp_variable_name('callback_frequency')] = array(
    '#type' => 'textfield',
    '#title' => t('Callback frequency'),
    '#description' => t("Please enter the the number of times to call an XMPP request per second from the web. This is used for registration, roster synchronization, and other purposes. You probably don't want to change this number unless you're experiencing connection problems."),
    '#default_value' => dxmpp_variable_get('callback_frequency'),
  );

  $form['libraries'] = array(
    '#type' => 'fieldset',
    '#title' => t('Library info'),
    '#collapsible' => TRUE,
  );
  $form['libraries']['strophe'] = array(
    '#type' => 'fieldset',
    '#title' => t('Strophe'),
    '#collapsible' => TRUE,
  );
  $form['libraries']['strophe'][dxmpp_variable_name('strophe_path')] = array(
    '#type' => 'textfield',
    '#title' => t('Strophe library'),
    '#description' => t("You need to download the latest stable release of the !library and extract the entire folder into sites/all/libraries. The path will be automatically discovered; you may override the directory path here if you wish to use another version; do not add slashes before or after the path.", array('!library' => l(t('Strophe library'), 'http://code.stanziq.com/strophe/', array('attributes' => array('target' => '_blank'))))),
    '#default_value' => dxmpp_variable_get('strophe_path'),
  );

  $form['libraries']['flxhr'] = array(
    '#type' => 'fieldset',
    '#title' => t('flXHR'),
    '#collapsible' => TRUE,
    '#collapsed' => !dxmpp_variable_get('use_flxhr'),
  );
  $form['libraries']['flxhr'][dxmpp_variable_name('use_flxhr')] = array(
    '#type' => 'checkbox',
    '#title' => t('Use flXHR'),
    '#default_value' => dxmpp_variable_get('use_flxhr'),
    '#description' => t('If you do not have a reverse proxy to the XMPP server set up, you will probably need to install and use the !flXHR browser cross-domain tool.', array('!flXHR' => l(t('flXHR'), 'http://flxhr.flensed.com/', array('attributes' => array('target' => '_blank'))))),
  );
  $form['libraries']['flxhr'][dxmpp_variable_name('flxhr_path')] = array(
    '#type' => 'textfield',
    '#title' => t('flXHR library path'),
    '#description' => t("Unless you have set up a reverse proxy, you may need to download the latest stable release of the !library and extract the entire folder into sites/all/libraries. The path will be automatically discovered; you may override the directory path here if you wish to use another version; do not add slashes before or after the path.", array('!library' => l(t('flXHR library'), 'http://flxhr.flensed.com/', array('attributes' => array('target' => '_blank'))))),
    '#default_value' => dxmpp_variable_get('flxhr_path'),
  );

  $form['libraries']['cycle'] = array(
    '#type' => 'fieldset',
    '#title' => t('jQuery Cycle'),
    '#collapsible' => TRUE,
  );
  $form['libraries']['cycle'][dxmpp_variable_name('use_jquery_cycle')] = array(
    '#type' => 'checkbox',
    '#title' => t('Use jQuery Cycle'),
    '#default_value' => dxmpp_variable_get('use_jquery_cycle'),
    '#description' => t('If checked and !cycle is present on the server, then the chat tabs will be displayed using a mini-carousel to browse through open chats. Note that the current implementation requires jQuery 1.4 or greater, and is not HTML compliant: see !issue.', array('!cycle' => l(t('jQuery Cycle'), 'http://malsup.com/jquery/cycle/', array('attributes' => array('target' => '_blank'))))),
  );
  $form['libraries']['cycle'][dxmpp_variable_name('jquery_cycle_path')] = array(
    '#type' => 'textfield',
    '#title' => t('jQuery Cycle path'),
    '#description' => t("If you wish to use jQuery Cycle, then enter its path here. Note the module will autodiscover the required file if it exists in the sites/all/libraries directory."),
    '#default_value' => dxmpp_variable_get('jquery_cycle_path'),
  );
  $form['libraries']['cycle'][dxmpp_variable_name('number_of_tabs_in_cycle')] = array(
    '#type' => 'textfield',
    '#title' => t('Number of tabs in cycle'),
    '#description' => t('If you are using jQuery Cycle, then enter the number of tabs to enclose in a single slide.'),
    '#default_value' => dxmpp_variable_get('number_of_tabs_in_cycle'),
  );

  $form[dxmpp_variable_name('icon_imagecache')] = array(
    '#type' => 'select',
    '#title' => t('Icon ImageCache preset'),
    '#default_value' => dxmpp_variable_get('icon_imagecache'),
    '#description' => t('Please select the ImageCache preset to use to resize user icons for the chat roster. Note that they will also be resized by the browser to %px regardless of this setting, unless overridden by the theme or CSS. You can !administer to add new presets. Requires the !imagecache module to be installed.', array('%px' => t('@w x @h pixels', array('@w' => dxmpp_variable_get('icon_width'), '@h' => dxmpp_variable_get('icon_height'))), '!administer' => l(t('manage ImageCache presets'), 'admin/build/imagecache'), '!imagecache' => l(t('ImageCache'), 'http://drupal.org/project/imagecache', array('attributes' => array('target' => '_blank')))))
  );
  $options = array('' => t('<none>'));
  if (module_exists('imagecache')) {
    foreach (imagecache_presets() as $preset) {
      $options[$preset['presetname']] = $preset['presetname'];
    }
  }
  else {
    $form[dxmpp_variable_name('icon_imagecache')]['#disabled'] = TRUE;
  }
  $form[dxmpp_variable_name('icon_imagecache')]['#options'] = $options;
  $form[dxmpp_variable_name('theme')] = array(
    '#type' => 'select',
    '#title' => t('Dxmpp Theme'),
    '#default_value' => dxmpp_variable_get('theme'),
    '#description' => t('Please select the Dxmpp Theme you want to use.'),
  	'#options' => array( 0 => 'Default', 1 => 'Gmail')
  );
  
  $form['audio_alert'] = array(
    '#type' => 'fieldset',
    '#title' => t('Audio alerts'),
    '#collapsible' => TRUE,
  );

  $form['audio_alert'][dxmpp_variable_name('use_audio_alerts')] = array(
    '#type' => 'checkbox',
    '#title' => t('Use Audio Alerts'),
    '#default_value' => dxmpp_variable_get('use_audio_alerts'),
    '#description' => t('If checked, then the audio alerts will be used to inform the user of new unread messages'),
  );

  $form['audio_alert'][dxmpp_variable_name('jplayer_path')] = array(
    '#type' => 'textfield',
    '#title' => t('jPlayer Path'),
    '#default_value' => dxmpp_variable_get('jplayer_path'),
    '#description' => t("You need to download the latest stable release of the !library and extract the entire folder into sites/all/libraries and rename the folder as 'jplayer'. The path will be automatically discovered; you may override the directory path here if you wish to use another version; do not add slashes before or after the path.", array('!library' => l(t('jPlayer'), 'http://www.happyworm.com/jquery/jplayer/download.htm', array('attributes' => array('target' => '_blank'))))),
  );
  if(!(dxmpp_variable_get('jplayer_path'))) {
  	$form['audio_alert'][dxmpp_variable_get('use_audio_alerts')]['#disabled'] = TRUE;
  }
  
  $form['message'] = array(
    '#type' => 'fieldset',
    '#title' => t('Message options'),
    '#collapsible' => TRUE,
  );

  $form['message'][dxmpp_variable_get('display_typing_message')] = array(
    '#type' => 'checkbox',
    '#title' => t('Display typing message'),
    '#default_value' => dxmpp_variable_get('display_typing_message'),
    '#description' => t('If checked, then the message below will be displayed to users when another user is composing a new message.'),
  );

  $form['message'][dxmpp_variable_name('typing_message')] = array(
    '#type' => 'textfield',
    '#title' => t('User is typing message'),
    '#default_value' => dxmpp_variable_get('typing_message'),
    '#description' => t('This message will be displayed to a user when another user is composing a message to them, assuming the box above has been checked.'),
  );

  $form[dxmpp_variable_name('help_path')] = array(
    '#type' => 'textfield',
    '#title' => t('Help path'),
    '#default_value' => dxmpp_variable_get('help_path'),
    '#description' => t('If you specify a path here, then a link titled %help will be displayed on the chat that directs there.', array('%help' => t('Help'))),
  );

  $form[dxmpp_variable_name('use_dxmpp_auth')] = array(
    '#type' => 'checkbox',
    '#title' => t('Use DXMPP Authorization'),
    '#default_value' => dxmpp_variable_get('use_dxmpp_auth'),
    '#description' => t("If checked, we'll use the DXMPP Authorization module to register new users. This requires both that we have that module enabled, and that the XMPP server be on the same local server as the Drupal installation."),
  );
  if (!module_exists('dxmpp_auth')) {
    $form[dxmpp_variable_name('use_dxmpp_auth')]['#disabled'] = TRUE;
  }
/*
  $form['http_pre_binding'] = array(
    '#type' => 'fieldset',
    '#title' => t('Http Pre Binding'),
    '#collapsible' => TRUE,
  );
  $form['http_pre_binding'][dxmpp_variable_name('prebind_acl_username')] = array(
    '#type' => 'textfield',
    '#title' => t(''),
    '#default_value' => dxmpp_variable_get('acl_password'),
    '#description' => t("This message will be displayed for users who have disabled JavaScript on their browser."),
  );
  $form['http_pre_binding'][dxmpp_variable_name('prebind_acl_password')] = array(
    '#type' => 'textfield',
    '#title' => t('Message to display for no JavaScript'),
    '#default_value' => dxmpp_variable_get('acl_password'),
    '#description' => t("This message will be displayed for users who have disabled JavaScript on their browser."),
  );*/
  $form['browser_detection'] = array(
    '#type' => 'fieldset',
    '#title' => t('Browser detection'),
    '#collapsible' => TRUE,
  );
  $form['browser_detection'][dxmpp_variable_name('no_js_message')] = array(
    '#type' => 'textfield',
    '#title' => t('Message to display for no JavaScript'),
    '#default_value' => dxmpp_variable_get('no_js_message'),
    '#description' => t("This message will be displayed for users who have disabled JavaScript on their browser."),
  );
  $form['browser_detection'][dxmpp_variable_name('disable_on_bad_browser')] = array(
    '#type' => 'checkbox',
    '#title' => t('Disable chat on bad browser'),
    '#default_value' => dxmpp_variable_get('disable_on_bad_browser'),
    '#description' => t("Currently, the chat doesn't display properly on Microsoft Internet Explorer 6 (IE6). Until this is fixed, you may wish to disable it with a warning for that browser, by checking this box. Doing so will add an automatic check for compatability in jQuery when the document first loads in a browser, disabling and warning the user with the message below."),
  );
  $form['browser_detection'][dxmpp_variable_name('disable_on_bad_browser_message_title')] = array(
    '#type' => 'textfield',
    '#title' => t('Message to display on bad browsers'),
    '#default_value' => dxmpp_variable_get('disable_on_bad_browser_message_title'),
    '#description' => t("If the box above is checked, then this message will be displayed to users on the IE6 browser."),
  );
  $form['browser_detection'][dxmpp_variable_name('disable_on_bad_browser_message')] = array(
    '#type' => 'textarea',
    '#title' => t('Message to display on bad browsers'),
    '#default_value' => dxmpp_variable_get('disable_on_bad_browser_message'),
    '#description' => t("If the box above is checked, then this explanatory message will be displayed to users on the IE6 browser if they click up on the chat box."),
  );

  return system_settings_form($form);
}

/**
 * Autodiscover a system path containing a library.
 *
 * This will attempt to automatically discover the system path to the folder
 * containing the desired library. It will first search in sites/example.com/libraries, then
 * sites/all/libraries.
 *
 * @param string $match
 *   The regex pattern to search for.
 * @return string
 *   The path to the system folder containing that library.
 */
function _dxmpp_autodiscover_path($match, $filename) {
  $path = '';
  $files = drupal_system_listing($match, 'libraries', 'basename', 0);
  if (isset($files[$filename])) {
    $path = dirname($files[$filename]->filename);
  }
  return $path;
}
