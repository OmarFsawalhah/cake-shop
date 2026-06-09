import { SpecForm } from './components/SpecForm';
import { CakeVisualizer } from './components/CakeVisualizer';

/**
 * Split-screen Custom Cake Builder.
 * Left: spec form (input).
 * Right: 3D visualizer (output, pure function of spec).
 */
export function CustomCakePage() {
  return (
    <section className="h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2">
      <div className="bg-white border-r overflow-hidden">
        <h1 className="text-2xl font-bold p-6 pb-0">Build Your Cake</h1>
        <SpecForm />
      </div>
      <div className="bg-cake-100">
        <CakeVisualizer />
      </div>
    </section>
  );
}
