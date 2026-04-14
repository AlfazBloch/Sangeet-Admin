import { createContext, useContext } from 'react';

const layoutManagerContext = createContext('');
export const LayoutManagerContextProvider = layoutManagerContext.Provider;
export const useLayoutManager = () => {
    return useContext(layoutManagerContext);
}