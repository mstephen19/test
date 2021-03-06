import React from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import GlobalProvider from './utils/redux/GlobalContext';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Main from './pages/Main';
import NotFound from './pages/NotFound';

import NavBarContainer from './components/NavBar/NavBarContainer';

const httpLink = createHttpLink({
  uri: '/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem('id_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default function App() {
  return (
    <ApolloProvider client={client}>
      <GlobalProvider>
        <Router>
          <NavBarContainer />
          <Switch>
            <Route exact path='/' component={Main} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </GlobalProvider>
    </ApolloProvider>
  );
}
