import { createContext, useContext } from "react";

const masterLayoutContext = createContext('');
export const MasterLayoutContextProvider = masterLayoutContext.Provider;
export const useMasterLayout = () =>{
    return useContext(masterLayoutContext);
}