<?php

function dxmpp_muc_settings_form() {


  $form = array();

  $form['dxmpp_muc'] = array(
    '#type' => 'fieldset',
    '#title' => t('Multi User Chat Settings'),
    '#collapsible' => TRUE,
  );
  
  $form['dxmpp_muc']['dxmpp_muc_subdomain_name'] = array(
    '#type' => 'textfield',
    '#title' => t('Subdomain on which MUC service is present'),
    '#default_value' => variable_get('dxmpp_muc_subdomain_name','conference'),
    '#description' => t("Name of the subdomain on which MUC service is present on your server. If you are not sure then don't change the default value."),
  );
  
  $form['dxmpp_muc']['dxmpp_muc_room_name'] = array(
    '#type' => 'textfield',
    '#title' => t('Chatroom Name'),
    '#default_value' => variable_get('dxmpp_muc_room_name','My_Room'),
    '#description' => t("Name of the Multi-User Chatroom"),
  );

  return system_settings_form($form);
}
