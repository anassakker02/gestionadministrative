import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch('/api')
      .then(res=>res.json())
      .then(data=> console.log(data));
  }, []);

  return (
    <div>
      <h1>Frontend prêt !</h1>
      <p>Les développeurs peuvent commencer à coder ici.</p>
    </div>
  );
}

export default App;
