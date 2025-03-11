import dynamic from 'next/dynamic';
import Layout from "./components/layout"

// Fix the dynamic imports by making sure they return a component
const TaskList = dynamic(() => import('./components/task-list').then(mod => mod.default || mod), { ssr: false });
const InsightsComponent = dynamic(() => import('./components/insights/pattern-recognition').then(mod => mod.default || mod), { ssr: false });

export default function Home() {
  return (
    <Layout>
      <main>
        <h1>Welcome to Agile Plus</h1>
        {/* These components won't cause SSR errors */}
        <TaskList />
        <InsightsComponent />
      </main>
    </Layout>
  )
}

