import { RouterProvider } from 'react-router';
import router from './Router';

export default function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
