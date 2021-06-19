import React from 'react';
import './App.css';
import { Hero } from 'react-bulma-components';
import { RestfulProvider } from 'restful-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { MessageProvider, useMessage } from './hooks/useMessage';
import { Notification } from './components/Notification';
import { AppRoute } from './AppRoute';
import { useCookies } from 'react-cookie';
import { Header } from './components/Header';

type response = {
  data?: any,
  message?: string;
};

const ApiProvider: React.FC = ({ children }) => {
  const { error } = useMessage();
  const [cookies] = useCookies(['user']);
  const { user: { jwt } } = cookies as any;
  const token = `Bearer ${jwt}`;
  return <RestfulProvider<response>
    base={process.env.REACT_APP_API_BASE_URL!}
    onError={(err) => {
      console.error(err);
      const message = (err.data as response).message || err.message
      error(message);
    }}
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
                <Header />
              </Hero.Header>
              <Hero.Body>
                <AppRoute />
              </Hero.Body>
            </Hero>
          </div>
        </AuthProvider>

      </ApiProvider>

    </MessageProvider>
  );
}

export default App;
