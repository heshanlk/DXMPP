<?php

/**
 * @file
 * Provides views support for dxmpp module
 */

/**
 * Implementation of hook_views_data()
 */
function dxmpp_views_data() {
	
  $data = array();
  $data['dxmpp_users']['table']['group']  = t('User');

  
  $data['dxmpp_users']['table']['join'] = array(
    'users' => array(
      'left_field' => 'uid',
      'field' => 'uid',
    ),
  );

  // Chat Presence Status
  $data['dxmpp_users']['presence'] = array(
    'title' => t('Chat Status'),
    'help' => t('Current online chat status of user.'),
    'field' => array(
      'handler' => 'views_handler_field_numeric',
      'click sortable' => TRUE,
     ),
    'filter' => array(
      'handler' => 'views_handler_filter_numeric',
    ),
    'sort' => array(
      'handler' => 'views_handler_sort',
    ),
  );



  return $data;
} 
