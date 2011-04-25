<?php

  /**
   * @file
   * Template file for theme_dxmpp_chat().
   *
   * This defines three variables here. You may add more by implementing
   * function THEMENAME_preprocess_dxmpp_chat().
   *
   * @param $settings
   *  The settings to pass to JavaScript.
   * @param $roster_wrapper
   *  The wrapper for the main expandable chat with a roster of online friends.
   * @param $chatbox_wrapper
   *  The wrapper for the expandable chat box area.
   */

  // Add our specific JavaScript settings.
  drupal_add_js(array('dxmpp' => $settings), 'setting');
  $opts = array('absolute' => TRUE, 'language' => '');
  $smileys_url = url(drupal_get_path('module', 'dxmpp').'/themes/images/smilieys/', $opts);
  drupal_add_js(
	array('dxmpp' =>
	array("smiley_url" => $smileys_url)), 'setting');
?>

<div id="dxmpp">
  <?php print $roster_wrapper; ?>
  <?php print $chatbox_wrapper; ?>
  <div id="dxmpp_jplayer"></div>
</div>
