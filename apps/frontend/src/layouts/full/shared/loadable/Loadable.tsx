// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Suspense } from 'react';
import { Loading } from 'src/components/ui/loading';

// project imports


// ===========================|| LOADABLE - LAZY LOADING ||=========================== //

const Loadable = (Component: any) => (props: any) =>
(
  <Suspense fallback={<Loading fullPage />}>
    <Component {...props} />
  </Suspense>
);

export default Loadable;
