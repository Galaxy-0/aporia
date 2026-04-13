import React from "react";
import {Text} from "ink";
import {useTypewriter} from "../hooks/use-typewriter.js";

export function StreamText({text}: {text: string}) {
  const {visibleText, isTyping} = useTypewriter(text, 8);

  return <Text>{visibleText}{isTyping ? "_" : ""}</Text>;
}
