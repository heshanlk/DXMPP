<?php

/**
 * @file
 * Define theme and theme preprocess functions for DXMPP.
 */

/**
 * Add the entire chatbox.
 */
function template_preprocess_dxmpp_chat(&$variables) {
  global $user;

  // Load the XMPP user/password. If there is none, then register & store.
  dxmpp_user_load($user);

  // If we have no associated record, then return.
  if (!$user->dxmpp) {
    return '';
  }

  /*  if (!isset($_SESSION['dxmpp_session_id'])) {
    // Set up a sufficiently large RID that will be incremented gradually
    // across page loads.
    //$_SESSION['dxmpp_request_id'] = rand(1000, 10000000);

    $dxmpp_http_result = dxmpp_post_request('http://admin%40localhost:admin@localhost:5280/warm/', 'jid='.$user->dxmpp->xmpp_username.'@localhost&password='.$user->dxmpp->xmpp_password);
    $doc = simplexml_load_string($dxmpp_http_result);

    //$conn = new dxmppUserConnect($user->dxmpp->xmpp_username, $user->dxmpp->xmpp_password, $_SESSION['dxmpp_request_id']);

    // @TODO: Grab the proper  SID.
    $_SESSION['dxmpp_request_id'] = (int)$doc->body->dl->dd[2][0];
    $_SESSION['dxmpp_session_id'] = (string)$doc->body->dl->dd[1][0];
    $_SESSION['dxmpp_session_jid'] = (string)$doc->body->dl->dd[0][0];
    drupal_set_message($_SESSION['dxmpp_request_id']);
    //print_r($dxmpp_http_result);

    }
    else {
    $_SESSION['dxmpp_request_id'] = $_SESSION['dxmpp_request_id'] + 1;
    drupal_set_message($_SESSION['dxmpp_request_id']);
    } */

  // Add the strophe library.
  drupal_add_js(dxmpp_strophe_path() . '/strophe.js');

  // Optionally add the flxHR library.
  if (dxmpp_variable_get('use_flxhr')) {
    drupal_add_js(dxmpp_flxhr_path() . '/flXHR.js');
    drupal_add_js(dxmpp_strophe_path() . '/plugins/strophe.flxhr.js');
  }

  // Optionally add the jPlayer js.
  if (dxmpp_variable_get('use_audio_alerts')) {
    drupal_add_js(dxmpp_jplayer_path() . '/' . dxmpp_variable_get('jplayer_filename'));
  }

  // Add jQuery Tabs & Sortabe.
  jquery_ui_add('jquery.ui.core');
  jquery_ui_add('jquery.ui.widget');
  jquery_ui_add('jquery.ui.mouse');
  jquery_ui_add('jquery.ui.tabs');
  jquery_ui_add('jquery.ui.sortable');

  // Add our listeners and other custom js & CSS.
  drupal_add_js(drupal_get_path('module', 'dxmpp') . '/themes/js/ba-emotify.js');
  drupal_add_js(drupal_get_path('module', 'dxmpp') . '/themes/js/dxmpp.js');
  if (dxmpp_variable_get('theme') == 0) {
    drupal_add_css(drupal_get_path('module', 'dxmpp') . '/themes/dxmpp.css');
  } else {
    drupal_add_css(drupal_get_path('module', 'dxmpp') . '/themes/dxmpp-gmail.css');
  }

  if (module_exists('image') && dxmpp_variable_get('icon_imagecache')) {
    $user_icon = file_create_url(image_style_path(dxmpp_variable_get('icon_imagecache'), $user->picture->uri));
  } else {
    $user_icon = file_create_url($user->picture->uri);
  }

  $jid = $user->dxmpp->xmpp_username . '@' . dxmpp_variable_get('domain');

  if (dxmpp_variable_get('use_jquery_cycle') && dxmpp_variable_get('jquery_cycle_path')) {
    $use_jquery_cycle = TRUE;
    drupal_add_js(dxmpp_jquery_cycle_path() . '/jquery.cycle.all.min.js');
  }

  // Add JS settings.
  $variables['settings'] = array(
    'sessionID' => $_SESSION['dxmpp_session_id'],
    'requestID' => $_SESSION['dxmpp_request_id'],
    'getUserListURL' => url('dxmpp/user-list'),
    'synchRosterURL' => url('dxmpp/synch-roster'),
    'setPresenceURL' => url('dxmpp/set-presence'),
    'blankRosterItem' => theme('dxmpp_blank_roster_item'),
    'blankChatbox' => theme('dxmpp_blank_chatbox'),
    'blankChatMessage' => theme('dxmpp_blank_chat_message'),
    'blankChatText' => theme('dxmpp_blank_chat_text'),
    'blankTitleSettings' => theme('dxmpp_blank_title'),
    'blankChatboxTitle' => theme('dxmpp_blank_chatbox_title'),
    'textFriendsSingular' => t(dxmpp_variable_get('text_friends_singular')),
    'textFriendsPlural' => t(dxmpp_variable_get('text_friends_plural')),
    'statusText' => array(
      DXMPP_STATUS_ONLINE => t('Available'),
      DXMPP_STATUS_AWAY => t('Away'),
      DXMPP_STATUS_INVISIBLE => t('Invisible'),
      DXMPP_STATUS_UNAVAILABLE => t('Unavailable'),
    ),
    'userIcon' => $user_icon,
    'iconHeight' => dxmpp_variable_get('icon_height'),
    'iconWidth' => dxmpp_variable_get('icon_width'),
    'rosterEmptyMessage' => theme('dxmpp_roster_empty_message'),
    'stropheConnection' => dxmpp_variable_get('server'),
    'mainUserName' => check_plain($user->name),
    'mainUID' => $user->uid,
    'jid' => $jid,
//     'jid' => $_SESSION['dxmpp_session_jid'],
    'password' => $user->dxmpp->xmpp_password,
    'roster' => dxmpp_roster($user),
    'defaultPicture' => '',
    'getRosterURL' => url('dxmpp/user-list'),
    'presence' => $user->dxmpp->presence,
    'originalPresence' => DXMPP_STATUS_ONLINE,
    'disableOnBadBrowser' => dxmpp_variable_get('disable_on_bad_browser'),
    'disableOnBadBrowserMessageTitle' => t(dxmpp_variable_get('disable_on_bad_browser_message_title')),
    'disableOnBadBrowserMessage' => t(dxmpp_variable_get('disable_on_bad_browser_message')),
    'useJqueryCycle' => $use_jquery_cycle,
    'numberOfTabsInCycle' => dxmpp_variable_get('number_of_tabs_in_cycle'),
    'displayTypingMessage' => dxmpp_variable_get('display_typing_message'),
    'typingMessage' => dxmpp_variable_get('typing_message'),
    'mp3_filepath' => url(drupal_get_path('module', 'dxmpp') . '/sounds/default.mp3'),
    'swfpath' => url(dxmpp_jplayer_path()),
    'use_audio_alerts' => dxmpp_variable_get('use_audio_alerts'),
  );

  $variables['roster_wrapper'] = theme('dxmpp_roster_wrapper');
  $variables['chatbox_wrapper'] = theme('dxmpp_chatbox_wrapper');
}

/**
 * The main roster box on the bottom right. Expands to display chat roster.
 */
function theme_dxmpp_roster_wrapper() {
  $output = '<div id="dxmpp-main" class="dxmpp-box dxmpp-main dxmpp-collapsed">';
  $output .= theme('dxmpp_title', t(dxmpp_variable_get('no_js_message')));
  $output .= theme('dxmpp_content', theme('dxmpp_blank_roster'));
  $output .= '</div>';
  return $output;
}

/**
 * The chatbox. Expands to display tabbed chats.
 */
function theme_dxmpp_chatbox_wrapper() {
  $output = '<div id="dxmpp-chatbox" class="dxmpp-box dxmpp-chatbox dxmpp-collapsed">';
  $output .= theme('dxmpp_title', t('Chatbox'));
  $output .= theme('dxmpp_content', '<ul></ul>');
  $output .= '</div>';
  return $output;
}

function theme_dxmpp_title($title = '') {
  return <<<OUTPUT
    <div class="dxmpp-header"><div class="dxmpp-title">$title</div><div class="dxmpp-expand"></div></div>
OUTPUT;
}

function theme_dxmpp_roster_empty_message() {
  return '<div id="dxmpp-empty-list-message" class="dxmpp-empty-list-message">' . t(dxmpp_variable_get('roster_empty_message')) . '</div>';
}

function theme_dxmpp_blank_roster() {
  return '<div id="dxmpp-roster" class="dxmpp-roster"><ul></ul></div>';
}

/*
  function theme_dxmpp_expand_button() {
  //   return '<div class="dxmpp-expand"></div>';
  } */

/**
 * This is an empty structure to be built in jQuery.
 */
function theme_dxmpp_blank_roster_item() {
  $output = <<<OUTPUT
  <li class="dxmpp-roster-item">
    <div class="dxmpp-roster-item-inner-wrapper">
      <div class="dxmpp-status"></div>
      <div class="dxmpp-username"></div>
      <div class="dxmpp-icon"></div>
    </div>
  </li>
OUTPUT;
  return $output;
}

function theme_dxmpp_blank_chatbox() {
  return <<<OUTPUT
    <div class="dxmpp-chat-messages"></div>
    <div class="dxmpp-chat-events"></div>
    <textarea class="dxmpp-chat-input" />
OUTPUT;
}

function theme_dxmpp_blank_chat_message() {
  return <<<OUTPUT
    <div class="dxmpp-chat-message">
      <div class="dxmpp-chat-text"></div>
      <div class="dxmpp-chat-message-info">
        <div class="dxmpp-chat-name"></div>
        <div class="dxmpp-chat-time"></div>
      </div>
    </div>
OUTPUT;
}

function theme_dxmpp_blank_chat_text() {
  return <<<OUTPUT
        <div class="dxmpp-chat-subtext">
        </div>
OUTPUT;
}

function theme_dxmpp_blank_title() {
  global $user;
  $settings = theme('dxmpp_blank_title_settings');
  $online_value = DXMPP_STATUS_ONLINE;
  $away_value = DXMPP_STATUS_AWAY;
  $invisible_value = DXMPP_STATUS_INVISIBLE;
  $unavailable_value = DXMPP_STATUS_UNAVAILABLE;
  $online = t('Available');
  $away = t('Away');
  $invisible = t('Invisible');
  $unavailable = t('Offline');
  return <<<OUTPUT
    <div class="dxmpp-main-title-content">
      <div class="dxmpp-icon"></div>
      <div class="dxmpp-name"></div>
      <div class="dxmpp-settings-status">
        <select>
          <option selected value="$online_value">$online</option>
          <option value="$away_value">$away</option>
          <option value="$invisible_value">$invisible</option>
          <option value="$unavailable_value">$unavailable</option>
        </select>
      </div>
      $settings
    </div>
OUTPUT;
}

function theme_dxmpp_blank_title_settings() {
  $help_path = dxmpp_variable_get('help_path');
  $help = $help_path ? l(t('Help'), $help_path) : '';
  $settings = <<<OUTPUT
      <div class="dxmpp-settings">
        $help
      </div>
OUTPUT;
  return $settings;
}

function theme_dxmpp_blank_chatbox_title() {
  return <<<OUTPUT
    <div class="dxmpp-chatbox-title-content">
      <div class="dxmpp-icon"></div>
      <div class="dxmpp-name"></div>
      <div class="dxmpp-title-status"></div>
    </div>
OUTPUT;
}

function theme_dxmpp_content($output = '') {
  return '<div class="dxmpp-content">' . $output . '</div>';
}
