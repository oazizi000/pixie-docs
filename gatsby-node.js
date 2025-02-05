/*
 * Copyright 2018- The Pixie Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const groupBy = require('lodash.groupby');

const startCase = require('lodash.startcase');
const utils = require('./src/functionPageUrl.ts');
const jsonDocumentation = require('./external/pxl_documentation.json');

exports.createPages = ({
  graphql,
  actions,
}) => {
  const { createPage } = actions;
  return new Promise((resolve, reject) => {
    resolve(
      graphql(
        `
          {
            site {
              pathPrefix
            }
            allMdx {
              edges {
                node {
                  fields {
                    id
                  }
                  tableOfContents
                  fields {
                    slug
                  }
                }
              }
            }
          }
        `,
      )
        .then((result) => {
          if (result.errors) {
            console.log(result.errors); // eslint-disable-line no-console
            reject(result.errors);
          }
          // Create blog posts pages.
          result.data.allMdx.edges.forEach(({ node }) => {
            createPage({
              path: node.fields.slug
                ? result.data.site.pathPrefix + node.fields.slug
                : result.data.site.pathPrefix,
              component: path.resolve('./src/templates/docs.tsx'),
              context: {
                id: node.fields.id,
              },
            });
          });
          const pxlObjectDocsPages = (
            qlobjectDocs,
            catPath,
            title,
            description,
          ) => {
            // Create the individual pages.
            qlobjectDocs.forEach((doc) => createPage({
              path: utils.functionPageUrl(doc.body.name, catPath),
              component: path.resolve('./src/templates/mutationDocs.tsx'),
              context: {
                data: JSON.stringify(doc),
                title: doc.body.name,
              },
            }));
            // Create index page.
            createPage({
              path: utils.functionPageUrl('', catPath),
              component: path.resolve('./src/templates/pxlObjectIndex.tsx'),
              context: {
                data: JSON.stringify(qlobjectDocs),
                pagePath: utils.functionPageUrl('', catPath),
                title,
                description,
              },
            });
          };
          pxlObjectDocsPages(
            jsonDocumentation.mutationDocs,
            'mutation',
            'Tracepoint Management',
            'Functions that manage the lifetime of a Tracepoint.',
          );
          pxlObjectDocsPages(
            jsonDocumentation.tracepointDecoratorDocs,
            'tracepoint-decorator',
            'Tracepoint Decorators',
            `The Decorator functions to wrap around a tracepoint function. 
           When defining the body of the tracepoint, see Tracepoint Fields.`,
          );
          pxlObjectDocsPages(
            jsonDocumentation.tracepointFieldDocs,
            'tracepoint-field',
            'Tracepoint Fields',
            `Field accessors to use while writing a tracepoint. Must be written 
           in a function wrapped by a Tracepoint Decorator.`,
          );
          pxlObjectDocsPages(
            jsonDocumentation.compileFnDocs,
            'compiler-fns',
            'Compile Time Functions',
            `Functions that are evaluated and usable at run time. Unlike [Execution Time Functions](/reference/pxl/udf), these are usable at compile-time
           meaning you can pass them as parameters to [Operators](/reference/pxl/operators) as well as [ExecTime functions](/reference/pxl/udf).`,
          );
          pxlObjectDocsPages(
            jsonDocumentation.dataframeOpDocs,
            'operators',
            'Operators',
            `The underlying DataFrame methods that correspond to Operators.
           meaning you can pass them as parameters to [Operators](/reference/pxl/operators) as well as [ExecTime functions](/reference/pxl/udf).
          `,
          );

          // create udfDocs index Pages
          createPage({
            path: utils.functionPageUrl('', 'udf'),
            component: path.resolve('./src/templates/udfDocsIndex.tsx'),
            context: {
              data: JSON.stringify(jsonDocumentation.udfDocs),
              title: 'Execution Time Functions',
              pagePath: utils.functionPageUrl('', 'tracepoint-field'),
            },
          });
          // create udfDocs Pages
          Object.values(
            groupBy(jsonDocumentation.udfDocs.udf, (x) => x.name),
          )
            .forEach((functions) => {
              createPage({
                path: utils.functionPageUrl(functions[0].name, 'udf'),
                component: path.resolve('./src/templates/udfDocs.tsx'),
                context: {
                  data: JSON.stringify(functions),
                  // TODO(philkuz/zasgar)  figure out better solution than just prepending here.
                  title: `px.${functions[0].name}`,
                },
              });
            });
          // create pyApiDocs Pages
          createPage({
            path: '/reference/api/py',
            component: path.resolve('./src/templates/pyDocsIndex.tsx'),
            context: {
              data: JSON.stringify(jsonDocumentation.pyApiDocs),
              title: 'Python',
              pagePath: '/reference/api/py',
            },
          });
        }),
    );
  });
};

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      alias: { $components: path.resolve(__dirname, 'src/components') },
    },
    node: {
      fs: 'empty',
    },
  });
};

exports.onCreateBabelConfig = ({ actions }) => {
  actions.setBabelPlugin({
    name: '@babel/plugin-proposal-export-default-from',
  });
};

exports.onCreateNode = ({
  node,
  getNode,
  actions,
}) => {
  const { createNodeField } = actions;

  if (node.internal.type === 'Mdx') {
    const parent = getNode(node.parent);
    const treePath = parent.relativePath.replace(parent.ext, '')
      .split('/');
    const level = treePath.filter((l) => l !== 'index').length;
    const title = node.frontmatter.title || startCase(parent.name);
    const slug = treePath
      .filter((l) => l !== 'index')
      .map((l) => (!Number.isNaN(Number.parseInt(l.substr(0, 2), 10))
        ? l.substr(3, l.length - 1)
        : l))
      .join('/');

    const sortingField = treePath
      .map((s) => (s === 'index' ? '00-index' : s))
      .join('/');

    createNodeField({
      name: 'slug',
      node,
      value: `/${slug}`,
    });

    createNodeField({
      name: 'id',
      node,
      value: node.id,
    });

    createNodeField({
      name: 'title',
      node,
      value: title,
    });
    createNodeField({
      name: 'level',
      node,
      value: level,
    });
    createNodeField({
      name: 'sorting_field',
      node,
      value: sortingField,
    });
    createNodeField({
      name: 'featuredInstall',
      node,
      value: node.frontmatter.featuredInstall || false,
    });
    createNodeField({
      name: 'featuredGuide',
      node,
      value: node.frontmatter.featuredGuide || false,
    });
    createNodeField({
      name: 'icon',
      node,
      value: node.frontmatter.icon || null,
    });
    createNodeField({
      name: 'description',
      node,
      value: node.frontmatter.metaDescription,
    });
    createNodeField({
      name: 'directory',
      node,
      value: !!node.frontmatter.directory,
    });
  } else if (node.internal.type === 'SitePage' && (node.path.match('/reference/pxl/.*') || node.path.match('/reference/api/.*'))) {
    const treePath = node.path.split('/');
    const level = treePath.length - 2;
    createNodeField({
      name: 'slug',
      node,
      value: node.path,
    });

    createNodeField({
      name: 'id',
      node,
      value: node.id,
    });

    createNodeField({
      name: 'title',
      node,
      value: node.context.title,
    });
    createNodeField({
      name: 'level',
      node,
      value: level,
    });
    // Set to false always to match the above, not completely sure why we need this.
    createNodeField({
      name: 'directory',
      node,
      value: false,
    });
  }
};
exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type Mdx implements Node {
      frontmatter: MdxFrontmatter
    }
    type MdxFrontmatter @infer {
    
      hidden: Boolean
    }
  `;
  createTypes(typeDefs);
};
