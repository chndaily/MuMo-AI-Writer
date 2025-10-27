
/**
 * return menu routes
 */
export const menuFilter = (items) => {
  return items
    .filter((item) => {
      const show = item.meta?.key;
      if (show && item.children) {
        item.children = menuFilter(item.children);
      }
      return show;
    })
    .sort((item) => item.order || Infinity);
};

/**
 * 基于 src/router/routes/modules 文件结构动态生成路由
 */
export function getRoutesFromModules() {
  const menuModules = [];

  // @ts-ignore
  const modules = import.meta.glob('./routes/modules/**/*.jsx', { eager: true });
  Object.keys(modules).forEach((key) => {
    // 修复模块导入问题，正确访问默认导出
    const mod = (modules[key] as any).default || {};
    const modList = Array.isArray(mod) ? [...mod] : [mod];
    menuModules.push(...modList);
  });
  return menuModules;
}

/**
 * return the routes will be used in sidebar menu
 */
export function getMenuRoutes(appRouteObjects) {
  // return menuFilter(getMenuModules());
  return menuFilter(appRouteObjects);
}

/**
 * return flatten routes
 */
export function flattenMenuRoutes(routes) {
  return routes.reduce((prev, item) => {
    const { meta, children } = item;
    if (meta) prev.push(meta);
    if (children) prev.push(...flattenMenuRoutes(children));
    return prev;
  }, []);
}
