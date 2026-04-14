import { createContext, useContext } from "react";

const registerContext = createContext('');

export const RegisterContextProvider = registerContext.Provider;
export const useRegister = () => {
    return useContext(registerContext)
}