import React, { Context, useContext } from 'react';

export function useContextSafe<T>(context: Context<T | null>): T {
  const contextValue = useContext(context);
  if (contextValue === null) {
    throw Error("Context has not been Provided!");
  }
  return contextValue;
}