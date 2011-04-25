<?php

/**
 * @file
 * Page callbacks for AJAX/JSON data.
 */

/**
 * Page callback for dxmpp/user-list.
 */
function dxmpp_user_list_json() {
  drupal_json(array('status' => 1, 'roster' => dxmpp_roster()));
}

/**
 * Page callback for dxmpp/synch-roster.
 */
function dxmpp_synch_roster_json() {
  global $user;

  $subscribed = json_decode($_REQUEST['subscribed']);
  $unsubscribed = json_decode($_REQUEST['unsubscribed']);
  $uid = $_REQUEST['uid'];

  if ($user->uid == $uid) {
    if (is_array($subscribed)) {
      foreach ($subscribed as $friend) {
        $relationship = db_fetch_object(db_query("SELECT uid, ruid, subscribed, in_roster, to_subscribe, to_roster FROM {dxmpp_roster} WHERE uid = %d AND ruid = %d", $uid, $friend));
        if ($relationship->to_subscribe && !$relationship->subscribed) {
          $relationship->subscribed = TRUE;
          drupal_write_record('dxmpp_roster', $relationship, array('uid', 'ruid'));
        }
      }
    }
    if (is_array($unsubscribed)) {
      foreach ($unsubscribed as $friend) {
        $relationship = db_fetch_object(db_query("SELECT uid, ruid, subscribed, in_roster, to_subscribe, to_roster FROM {dxmpp_roster} WHERE uid = %d AND ruid = %d", $uid, $friend));
        if (!$relationship->to_subscribe) {
          watchdog('dxmpp', 'Unsubscribed %friend from %user.', array('%friend' => $relationship->ruid, '%user' => $relationship->uid));
          db_query("DELETE FROM {dxmpp_roster} WHERE uid = %d AND ruid = %d", $uid, $friend);
        }
      }
    }
    drupal_json(array('status' => 1));
  }
  else {
    drupal_json(array('status' => 0, 'error' => t('Access denied.')));
  }
}

/**
 * Page callback for dxmpp/set-presence.
 */
function dxmpp_set_presence_json() {
  global $user;

  $xmpp = array(
    'uid' => $_REQUEST['uid'],
    'presence' => $_REQUEST['presence'],
  );

  if ($user->uid && ($user->uid == $xmpp['uid'])) {
    // Set presence in DB.

    drupal_write_record('dxmpp_users', $xmpp, array('uid'));
    drupal_json(array('status' => 1, 'uid' => $xmpp['uid'], 'presence' => $xmpp['presence']));
  }
  else {
    drupal_json(array('status' => 0, 'error' => t('Access denied.')));
  }
}
