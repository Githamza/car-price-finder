import React from "react";
import BackgroundWrapper from "./components/BackgroundWrapper";
import TitleSection from "./components/TitleSection";
import InputSection from "./components/InputSection";

function App() {
  return (
    <BackgroundWrapper>
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
        <TitleSection />
        <InputSection />
      </main>
    </BackgroundWrapper>
  );
}

export default App;
