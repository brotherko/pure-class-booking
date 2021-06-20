import React from 'react';
import './App.css';
import { Hero } from 'react-bulma-components';
import { RestfulProvider } from 'restful-react';
import { AuthProvider } from './hooks/useAuth';
import { MessageProvider, useMessage } from './hooks/useMessage';
import { Notification } from './components/Notification';
import { useCookies } from 'react-cookie';
import { AppRoute } from './AppRoute';
import _ from 'lodash';

type response = {
  data?: any,
  message?: string;
};

const ApiProvider: React.FC = ({ children }) => {
  const { error } = useMessage();
  const [cookies] = useCookies(['user']);
  const jwt = _.get(cookies, ['user', 'jwt'])
  let token; 
  if (jwt) {
    token = `Bearer ${jwt}`;
  }
  return <RestfulProvider<response>
    base="/api"
    onError={(err) => {
      console.error(err);
      const message = (err.data as response).message || err.message
      error(message);
    }}
    resolve={data => data.data}
    requestOptions={() => ({ headers: { Authorization: token } })}
  >{children}
  </RestfulProvider>;

};

function App() {

  return (
    <MessageProvider>
      <ApiProvider>
        <AuthProvider>
          <div className="App">
            <Hero size="fullheight">
              <Hero.Header>
                <Notification />
                {/* <Header /> */}
              </Hero.Header>
              <AppRoute />
            </Hero>
          </div>
        </AuthProvider>

      </ApiProvider>

    </MessageProvider>
  );
}

export default App;
