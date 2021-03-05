/* TODO: ONCE WE WORK OUT PLUGIN WEIGHTING / ORDERING WE CAN LOAD ALPHABETICALLY
const s_LOADERS = [
   require('@typhonjs-node-rollup/plugin-alias'),
   require('@typhonjs-node-rollup/plugin-babel'),
   require('@typhonjs-node-rollup/plugin-json'),
   require('@typhonjs-node-rollup/plugin-node-resolve'),
   require('@typhonjs-node-rollup/plugin-postcss'),
   require('@typhonjs-node-rollup/plugin-replace'),
   require('@typhonjs-node-rollup/plugin-sourcemaps'),
   require('@typhonjs-node-rollup/plugin-string'),
   require('@typhonjs-node-rollup/plugin-terser'),
   require('@typhonjs-node-rollup/plugin-typescript'),
];
*/

import pluginReplace       from '@typhonjs-node-rollup/plugin-replace';
import pluginAlias         from '@typhonjs-node-rollup/plugin-alias';
import pluginBabel         from '@typhonjs-node-rollup/plugin-babel';
import pluginJSON          from '@typhonjs-node-rollup/plugin-json';
import pluginNodeResolve   from '@typhonjs-node-rollup/plugin-node-resolve';
import pluginPostCSS       from '@typhonjs-node-rollup/plugin-postcss';
import pluginString        from '@typhonjs-node-rollup/plugin-string';
import pluginTypescript    from '@typhonjs-node-rollup/plugin-typescript';
import pluginSourcemaps    from '@typhonjs-node-rollup/plugin-sourcemaps';
import pluginTerser        from '@typhonjs-node-rollup/plugin-terser';

const s_LOADERS = [
   pluginReplace,
   pluginAlias,
   pluginBabel,
   pluginJSON,
   pluginNodeResolve,
   pluginPostCSS,
   pluginString,
   pluginTypescript,
   pluginSourcemaps,
   pluginTerser
];

const s_NO_CONFLICT_WARNING = '@typhonjs-node-rollup/plugin-bundle-core - Aborted loading the following bundled '
 + 'plugins as duplicates detected:\n';

/**
 * Oclif init hook to add PluginHandler to plugin manager.
 *
 * @param {object} options - options of the CLI action.
 *
 * @returns {Promise<void>}
 */
export default async function(options)
{
   try
   {
      global.$$eventbus.trigger('log:debug', `plugin-bundle-core init hook running '${options.id}'.`);

      const noConflictLoaders = s_FIND_NO_CONFLICT_LOADERS(s_LOADERS, options);

      let loaded = '';

      for (const loader of noConflictLoaders)
      {
         loaded += `- ${loader.packageName}\n`;

         global.$$pluginManager.add({ name: loader.packageName, instance: loader });
      }

      if (loaded !== '')
      {
         global.$$eventbus.trigger('log:verbose',
          `@typhonjs-node-rollup/plugin-bundle-core - Loaded the following bundled plugins: \n${loaded}`);
      }
   }
   catch (error)
   {
      this.error(error);
   }
}

/**
 * Finds all bundled plugin loaders which don't conflict with other plugins.
 *
 * @param {Array}    loaders -
 * @param {object}   options -
 *
 * @returns {Object[]} Array of bundled plugin loaders that don't conflict with other Oclif plugins.
 */
function s_FIND_NO_CONFLICT_LOADERS(loaders, options)
{
   const noConflictLoaders = [];

   // Options doesn't contain plugin array so return all loaders.
   if (typeof options !== 'object' && typeof options.config !== 'object' && !Array.isArray(options.config.plugins))
   {
      return loaders;
   }

   let warning = s_NO_CONFLICT_WARNING;

   for (const loader of s_LOADERS)
   {
      let conflict = false;

      for (const oclifPlugin of options.config.plugins)
      {
         if (typeof oclifPlugin.pjson === 'object' && typeof oclifPlugin.pjson.dependencies === 'object')
         {
            for (const conflictPackage of loader.conflictPackages)
            {
               if (conflictPackage in oclifPlugin.pjson.dependencies)
               {
                  conflict = true;
                  warning += `- ${loader.packageName} conflicts with ${oclifPlugin.type} ${oclifPlugin.pjson.name}\n`;
                  break;
               }
            }
         }
      }

      if (!conflict)
      {
         noConflictLoaders.push(loader);
      }
   }

   if (warning !== s_NO_CONFLICT_WARNING)
   {
      global.$$eventbus.trigger('log:verbose', warning);
   }

   return noConflictLoaders;
}