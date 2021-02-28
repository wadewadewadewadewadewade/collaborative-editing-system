import '../styles/globals.css'
import { createContext } from 'react'
import { LoaderProvider, useLoading, BallTriangle } from '@agney/react-loading'
import { useState } from 'react';
import Router from 'next/router';

export const LoadingIndicatorContext = createContext();

export const LoadingIndicatorProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  // https://reactjsexample.com/simple-and-accessible-loading-indicators-with-react/
  const { containerProps, indicatorEl } = useLoading({
    loading: isLoading,
    indicator: <BallTriangle width="50" />
  });
  Router.events.on('routeChangeStart', () => setIsLoading(true)); 
  Router.events.on('routeChangeComplete', () => setIsLoading(true)); 
  Router.events.on('routeChangeError', () => setIsLoading(true)); 
  return (
    <LoadingIndicatorContext.Provider
      value={{ setIsLoading }}
    >
      <LoaderProvider>
        {children}
        {isLoading && <section className="loading-indicator" {...containerProps}>{indicatorEl}</section>}
      </LoaderProvider>
    </LoadingIndicatorContext.Provider>
  )
}

function MyApp({ Component, pageProps }) {
  return (
    <LoadingIndicatorProvider>
      <Component {...pageProps} />
    </LoadingIndicatorProvider>
  )
}

export default MyApp
