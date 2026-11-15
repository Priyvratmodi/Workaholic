import React from 'react';

export type IconName =
  | 'add'
  | 'alarm'
  | 'alternate_email'
  | 'archive'
  | 'arrow_back'
  | 'arrow_downward'
  | 'arrow_forward'
  | 'attach_file'
  | 'auto_awesome'
  | 'auto_stories'
  | 'calendar_month'
  | 'calendar_today'
  | 'calendar_view_week'
  | 'campaign'
  | 'chat_bubble'
  | 'chat_bubble_outline'
  | 'check'
  | 'check_box'
  | 'check_circle'
  | 'checklist'
  | 'chevron_right'
  | 'close'
  | 'cloud_done'
  | 'cloud_upload'
  | 'code'
  | 'commit'
  | 'content_copy'
  | 'contrast'
  | 'conversion_path'
  | 'dashboard'
  | 'dashboard_customize'
  | 'dark_mode'
  | 'delete'
  | 'description'
  | 'desktop_windows'
  | 'drag_indicator'
  | 'drive_file_move'
  | 'edit'
  | 'error'
  | 'event_repeat'
  | 'expand_more'
  | 'filter_list'
  | 'format_bold'
  | 'format_italic'
  | 'format_list_bulleted'
  | 'format_list_numbered'
  | 'forum'
  | 'grid_view'
  | 'group_add'
  | 'groups'
  | 'help'
  | 'help_outline'
  | 'history'
  | 'hub'
  | 'image'
  | 'info'
  | 'insights'
  | 'ios_share'
  | 'keyboard'
  | 'keyboard_arrow_down'
  | 'label'
  | 'light_mode'
  | 'link'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'manage_accounts'
  | 'mode_comment'
  | 'more_horiz'
  | 'more_vert'
  | 'notifications'
  | 'notifications_active'
  | 'open_in_new'
  | 'palette'
  | 'person'
  | 'person_add'
  | 'person_remove'
  | 'priority_high'
  | 'radio_button_unchecked'
  | 'refresh'
  | 'restart_alt'
  | 'rocket_launch'
  | 'save'
  | 'schedule'
  | 'search'
  | 'security'
  | 'send'
  | 'sentiment_satisfied'
  | 'settings'
  | 'share'
  | 'sort'
  | 'south'
  | 'space_dashboard'
  | 'star'
  | 'star_border'
  | 'subject'
  | 'swap_horiz'
  | 'task_alt'
  | 'terminal'
  | 'tune'
  | 'unfold_more'
  | 'verified'
  | 'view_kanban'
  | 'view_timeline'
  | 'visibility'
  | 'visibility_off'
  | 'warning'
  | 'web'
  | 'block'
  | 'neurology'
  | 'psychology'
  | 'person_alert'
  | 'sync'
  | 'sync_problem'
  | (string & {});

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  size?: number | string;
  filled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size,
  filled = false,
  className = '',
  'aria-label': ariaLabel,
  style,
  ...rest
}) => {
  const sizeStyle: React.CSSProperties = size
    ? {
        fontSize: typeof size === 'number' ? `${size}px` : size,
        width: typeof size === 'number' ? `${size}px` : undefined,
        height: typeof size === 'number' ? `${size}px` : undefined,
      }
    : {};

  const variationStyle: React.CSSProperties = filled
    ? { fontVariationSettings: "'FILL' 1" }
    : { fontVariationSettings: "'FILL' 0" };

  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`.trim()}
      style={{
        ...sizeStyle,
        ...variationStyle,
        ...style,
      }}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      {...rest}
    >
      {name}
    </span>
  );
};
