// Auto-import all entity configurations
const entityConfigs = {};

// Import all .js files from entities folder
const entityModules = import.meta.glob('./entities/*.js', { eager: true });

for (const path in entityModules) {
  const module = entityModules[path];
  const config = module.default;
  if (config && config.name) {
    entityConfigs[config.name] = config;
  }
}

export const getEntityConfig = (entityName) => {
  return entityConfigs[entityName] || {};
};

export const getAllEntityConfigs = () => {
  return Object.values(entityConfigs);
};