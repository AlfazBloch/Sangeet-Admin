import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MasterLayout, Register, Home, Track, Albums, ProcessingOverview } from "./compnents/index";
import './app.css';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Register />
    },
    {
      path: '/admin-panel',
      element: <MasterLayout />,
      children: [{
        path: '',
        element: <Home />
      },{
        path: 'create-track',
        element: <Track />
      },{
        path: 'albums',
        element: <Albums />
      },{
        path: 'processing-overview',
        element: <ProcessingOverview/>
      }]
    } 
  ]);
  return (
   <>
      <RouterProvider router={router} />
   </>
  )
}

export default App