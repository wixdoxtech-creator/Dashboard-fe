import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from "react-redux";
import { AuthProvider } from './contexts/AuthContext.tsx'
import { store } from './store/store.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <Provider store={store}> 
    <AuthProvider>
      <App isSidebarOpen={true} />
    </AuthProvider>
    </Provider>
  </StrictMode>
)
