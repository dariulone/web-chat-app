import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { colorSchemes, typography, shadows, shape } from './themePrimitives';
import { GlobalStyles } from '@mui/material';

function AppTheme(props) {
  const { children, disableCustomTheme, themeComponents } = props;
  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? {}
      : createTheme({
          // For more details about CSS variables configuration, see https://mui.com/material-ui/customization/css-theme-variables/configuration/
          cssVariables: {
            colorSchemeSelector: 'data-mui-color-scheme',
            cssVarPrefix: 'template',
          },
          colorSchemes, // Recently added in v6 for building light & dark mode app, see https://mui.com/material-ui/customization/palette/#color-schemes
          typography,
          shadows,
          shape,
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations,
            ...feedbackCustomizations,
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...themeComponents,
          },
        });
  }, [disableCustomTheme, themeComponents]);
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      <GlobalStyles
        styles={{
          "*:focus": {
            outline: "none",
          },
          'input:-webkit-autofill, textarea:-webkit-autofill, select:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px transparent inset !important', // Убирает стандартный фон
            WebkitTextFillColor: 'inherit !important', // Унаследовать цвет текста
            transition: 'background-color 5000s ease-in-out 0s', // Убирает вспышку цвета
          },
          '[data-mui-color-scheme="dark"] input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px rgba(144, 0, 255, 0.1) inset !important',
            WebkitBorderRadius: '0 !important', // Убирает закругления для автозаполнения
          },
          '[data-mui-color-scheme="light"] input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px rgba(144, 0, 255, 0.1) inset !important',
            WebkitBorderRadius: '0 !important', // Убирает закругления для автозаполнения
          },
          '::-webkit-scrollbar': {
            width: '2px !important',
            height: '2px !important',
          },
          '::-webkit-scrollbar-track': {
            background: '#f0f0f0',
            borderRadius: '4px',
          },
          '::-webkit-scrollbar-thumb': {
            background: '#9000ff',
            borderRadius: '4px',
            border: '2px solid #f0f0f0',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: '#6000ff',
          },
          '*': {
            scrollbarWidth: 'thin', // Firefox

          },
        }}
      />
      {children}
</ThemeProvider>
  );
}

AppTheme.propTypes = {
  children: PropTypes.node,
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme: PropTypes.bool,
  themeComponents: PropTypes.object,
};

export default AppTheme;
