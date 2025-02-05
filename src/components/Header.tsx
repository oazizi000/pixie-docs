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

import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import { graphql, Link, StaticQuery } from 'gatsby';
import BodyClassName from 'react-body-classname';

import Hidden from '@material-ui/core/Hidden';
import Button from '@material-ui/core/Button';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import logoImg from '../images/pixie-logo-header.svg';
import slackIcon from './images/slack-icon.svg';
import mailIcon from './images/mail-icon.svg';
import SearchResultsDropdown from './search-results-dropdown';

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.modal + 1,
  },
  toolbar: {
    flexGrow: 1,
    [theme.breakpoints.up('md')]: {
      padding: '0 30px',
      paddingLeft: '5px',
    },
  },
  middle: {
    flexGrow: 1,
  },
  mainTocButton: {
    color: '#ffffff',
    marginRight: '12px',
  },
  menuButton: {
    marginRight: theme.spacing(2),
    height: '21px',
    verticalAlign: 'middle',
  },
  buttons: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  dropMenuRef: {
    position: 'relative',
    display: 'inline-block',
  },
  dropMenu: {
    position: 'absolute',
    top: `calc(${theme.overrides.MuiToolbar.root.minHeight} / 2 - 4px)`,
    boxShadow: theme.palette.type === 'light' ? '0px 15px 130px 0px rgba(0,0,0,0.10)' : '0px 15px 130px 0px rgba(0,0,0,0.45)',
    right: 0,
    zIndex: 1,
    backgroundColor: theme.palette.type === 'light' ? '#212324' : '#212324',
    width: '189px',
    borderRadius: '7px',
  },
  dropMenuItem: {
    color: theme.palette.type === 'light' ? '#B2B5BB' : '#B2B5BB',
    fontSize: '14px',
    lineHeight: '24px',
    padding: '14px',
    '& a': {
      '& img': {
        paddingLeft: '20px',
        paddingRight: '20px',
        height: '18px',
        width: '18px',
      },
      textDecoration: 'none',
      fontStyle: 'inherit',
      color: 'inherit',
    },
  },
  menuItem: {
    color: '#ffffff',
  },

}));

interface Props {
  location: string,
  theme: string,
  onThemeTypeSwitch: any
  setDrawerOpen: any,
  drawerOpen: boolean,
  setSidebarOpen: any,
  sidebarOpen: boolean
}

interface RenderProps {
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const Header = ({
  drawerOpen, setDrawerOpen,
  setSidebarOpen,
  sidebarOpen,
  onThemeTypeSwitch,
  theme,
}: Props) => {
  const toggleToc = () => {
    setDrawerOpen(!drawerOpen);
    setSidebarOpen(!sidebarOpen);
  };

  const [openSupportMenu, setOpenSupportMenu] = React.useState(false);

  const classes = useStyles();

  const getReferrer = () => {
    if (typeof window === 'undefined') return 'https://pixielabs.ai';
    const ref = sessionStorage.getItem('referrer');
    return ref && ref.includes('work.withpixie.ai') ? ref : 'https://pixielabs.ai';
  };
  return (
    <StaticQuery
      query={graphql`
      query headerTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
      render={(data: RenderProps) => {
        const siteTitle = data.site.siteMetadata.title;
        return (
          <AppBar title={siteTitle} position='fixed' className={classes.appBar}>
            <BodyClassName className={`theme-${theme}`} />
            <Toolbar className={classes.toolbar}>
              <IconButton onClick={toggleToc} className={classes.mainTocButton}>
                <MenuIcon />
              </IconButton>
              <Link to='/'>
                <img className={classes.menuButton} src={logoImg} alt='logo' />
              </Link>
              <div className={classes.middle} />
              <div className={classes.buttons}>
                <IconButton
                  className={classes.menuItem}
                  size='small'
                  onClick={(e) => {
                    e.preventDefault();
                    onThemeTypeSwitch();
                  }}
                >
                  {theme === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>
                <Hidden smDown implementation='css'>
                  <ClickAwayListener onClickAway={() => setOpenSupportMenu(false)}>
                    <Button className={classes.menuItem} color='default' size='inherit' aria-controls='support-menu' aria-haspopup='true' onClick={() => setOpenSupportMenu((prev) => !prev)}>Support</Button>
                  </ClickAwayListener>
                  <div className={classes.dropMenuRef}>
                    {openSupportMenu ? (
                      <div className={classes.dropMenu}>
                        <div
                          className={classes.dropMenuItem}
                          onClick={() => setOpenSupportMenu(false)}
                        >
                          <a
                            href='https://slackin.withpixie.ai/'
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <img
                              className={classes.menuButton}
                              src={slackIcon}
                              alt='logo'
                            />
                            Slack
                          </a>
                        </div>
                        <div
                          className={classes.dropMenuItem}
                          onClick={() => setOpenSupportMenu(false)}
                        >
                          <a
                            href='mailto:cs@pixielabs.ai'
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <img
                              className={classes.menuButton}
                              src={mailIcon}
                              alt='logo'
                            />
                            Email Us
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Hidden>
                <SearchResultsDropdown />
                <Hidden mdDown implementation='css'>
                  <Button href={getReferrer()} size='small' color='secondary' variant='contained'>Back to Pixie</Button>
                </Hidden>
              </div>
            </Toolbar>
          </AppBar>
        );
      }}
    />
  );
};
export default Header;
