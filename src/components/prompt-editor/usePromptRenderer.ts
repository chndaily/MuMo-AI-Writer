import { useCallback } from "react";
import { PromptRenderer } from "./core/PromptRenderer";
import { GlobalContext } from "./types";
import { promptAllFunctions } from "./functions";



const usePromptRenderer = (context: GlobalContext) => {
  return useCallback((template: string) => {
    const renderer = new PromptRenderer({
      variables: {},
      functions: promptAllFunctions,
      globalContext: context
    });
    return renderer.render(template);
  }, [context]);
};

export default usePromptRenderer;