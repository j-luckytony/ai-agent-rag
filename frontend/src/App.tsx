import './App.css';
import { ChatInterface } from './components/ChatInterface';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto h-[calc(100vh-2rem)] max-w-4xl">
        <ChatInterface
          placeholder="Ask me about military procedures or forms..."
          showSources={true}
          showReasoning={false}
        />
      </div>
    </div>
  );
}

export default App;
