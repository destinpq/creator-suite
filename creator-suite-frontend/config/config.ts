// https://umijs.org/config/

import { join } from 'node:path';
import { defineConfig } from '@umijs/max';
import { theme } from 'antd';
import defaultSettings from './defaultSettings';
import proxy from './proxy';

import routes from './routes';

const { UMI_ENV = 'dev' } = process.env;

/**
 * @name Use public path
 * @description The path for deployment, configure this variable if deploying to a non-root directory
 * @doc https://umijs.org/docs/api/config#publicpath
 */
const PUBLIC_PATH: string = '/';

export default defineConfig({
  /**
   * @name Enable hash mode
   * @description Make build artifacts contain hash suffixes. Usually used for incremental releases and avoiding browser caching.
   * @doc https://umijs.org/docs/api/config#hash
   */
  hash: true,

  publicPath: PUBLIC_PATH,

  /**
   * @name Compatibility settings
   * @description IE11 compatibility is not guaranteed to be perfect, need to check all dependencies you use
   * @doc https://umijs.org/docs/api/config#targets
   */
  // targets: {
  //   ie: 11,
  // },
  /**
   * @name Route configuration, files not included in routes will not be compiled
   * @description Only supports configuration of path, component, routes, redirect, wrappers, title
   * @doc https://umijs.org/docs/guides/routes
   */
  // umi routes: https://umijs.org/docs/routing
  routes,
  /**
   * @name Theme configuration
   * @description Although called theme, it's actually just less variable settings
   * @doc antd theme settings https://ant.design/docs/react/customize-theme-cn
   * @doc umi theme configuration https://umijs.org/docs/api/config#theme
   */
  // theme: { '@primary-color': '#1DA57A' }
  /**
   * @name Moment internationalization configuration
   * @description If internationalization is not required, enabling this can reduce JS bundle size
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: false,
  /**
   * @name Proxy configuration
   * @description Allows your local server to proxy to your server, so you can access server data
   * @see Note that proxy can only be used during local development, it won't work after build.
   * @doc Proxy introduction https://umijs.org/docs/guides/proxy
   * @doc Proxy configuration https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[UMI_ENV as keyof typeof proxy],
  /**
   * @name Fast refresh configuration
   * @description A nice hot update component that can preserve state during updates
   */
  fastRefresh: true,
  //============== The following are all max plugin configurations ===============
  /**
   * @name Data flow plugin
   * @@doc https://umijs.org/docs/max/data-flow
   */
  model: {},
  dva: {},
  /**
   * A global initial data flow that can be used to share data between plugins
   * @description Can be used to store some global data, such as user information, or some global state. Global initial state is created at the very beginning of the entire Umi project.
   * @doc https://umijs.org/docs/max/data-flow#%E5%85%A8%E5%B1%80%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81
   */
  initialState: {},
  /**
   * @name layout 插件
   * @doc https://umijs.org/docs/max/layout-menu
   */
  title: 'Creator Suite',
  layout: {
    locale: true,
    ...defaultSettings,
  },
  /**
   * @name moment2dayjs plugin
   * @description Replace moment with dayjs in the project
   * @doc https://umijs.org/docs/max/moment2dayjs
   */
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },
  /**
   * @name Internationalization plugin
   * @doc https://umijs.org/docs/max/i18n
   */
  locale: {
    // default en-US
    default: 'en-US',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: true,
  },
  /**
   * @name antd plugin
   * @description Built-in babel import plugin
   * @doc https://umijs.org/docs/max/antd#antd
   */
  antd: {
    appConfig: {},
    configProvider: {
      theme: {
        algorithm: theme.darkAlgorithm,
        cssVar: true,
        token: {
          fontFamily: 'AlibabaSans, sans-serif',
        },
      },
    },
  },
  /**
   * @name Network request configuration
   * @description Based on axios and ahooks' useRequest, it provides a unified network request and error handling solution.
   * @doc https://umijs.org/docs/max/request
   */
  request: {},
  /**
   * @name Access control plugin
   * @description Permission plugin based on initialState, must enable initialState first
   * @doc https://umijs.org/docs/max/access
   */
  access: {},
  /**
   * @name Additional scripts in <head>
   * @description Configure additional scripts in <head>
   */
  headScripts: [
    // Solve the white screen issue on first load
    { src: join(PUBLIC_PATH, 'scripts/loading.js'), async: true },
  ],
  //================ pro plugin configuration ==================
  presets: ['umi-presets-pro'],
  /**
   * @name openAPI plugin configuration
   * @description Generate serve and mock based on openapi specification, can reduce a lot of boilerplate code
   * @doc https://pro.ant.design/zh-cn/docs/openapi/
   */
  /**
   * @name Whether to enable mako
   * @description Use mako for ultra-fast development
   * @doc https://umijs.org/docs/api/config#mako
   */
  mako: {},
  esbuildMinifyIIFE: true,
  exportStatic: {},
  define: {
    'process.env.CI': process.env.CI,
  },
}) as Parameters<typeof defineConfig>[0];
