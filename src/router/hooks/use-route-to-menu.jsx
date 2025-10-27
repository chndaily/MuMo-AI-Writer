import { useCallback } from 'react';

import { Iconify, SvgIcon } from '@/components/icon';

const renderIcon = (icon) => {
  if (typeof icon !== 'string') return icon;

  return icon.startsWith('ic') ? (
    <SvgIcon icon={icon} size={24} className="ant-menu-item-icon" />
  ) : (
    <Iconify icon={icon} size={24} className="ant-menu-item-icon" />
  );
};

const renderLabel = (label, suffix) => {
  return (
    <div className="flex items-center">
      <div>{label}</div>
      {suffix}
    </div>
  );
};

/**
 *   routes -> menus
 */
export function useRouteToMenuFn() {

  const routeToMenuFn = useCallback(
    (items) => {
      return items
        .filter((item) => !item.meta?.hideMenu)
        .map((item) => {
          const { meta, children } = item;
          if (!meta) return {};

          const menuItem = {
            key: meta.key,
            disabled: meta.disabled,
            label: renderLabel(meta.label, meta.suffix),
            ...(meta.icon && { icon: renderIcon(meta.icon) }),
            ...(children && { children: routeToMenuFn(children) }),
          };

          return menuItem;
        });
    },
    [t],
  );
  return routeToMenuFn;
}
