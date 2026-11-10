import fs from 'fs';
import path from 'path';

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error("Usage: node generate_playground.mjs <ComponentName> <ComponentSlug> <ImportPath> [category]");
  process.exit(1);
}

const [componentName, componentSlug, importPath, category = 'layout'] = args;

// Paths
const rootDir = process.cwd();
const registryPath = path.join(rootDir, 'src', 'config', 'playground.ts');
const demoComponentPath = path.join(rootDir, 'src', 'components', 'layout', `${componentSlug.replace(/-/g, '_')}_demo.tsx`);
const routePageDir = path.join(rootDir, 'src', 'app', 'playground', componentSlug);
const routePagePath = path.join(routePageDir, 'page.tsx');

console.log(`Generating playground files for: ${componentName}...`);

// 1. Update Registry src/config/playground.ts
try {
  let registryContent = fs.readFileSync(registryPath, 'utf8');
  
  // Create the new entry string
  const entryStr = `  {
    name: "${componentName}",
    slug: "${componentSlug}",
    description: "Interactive sandbox for testing the ${componentName} component.",
    category: "${category}",
  },`;

  // Find the closing bracket of PLAYGROUND_COMPONENTS array
  const arrayStartIdx = registryContent.indexOf('PLAYGROUND_COMPONENTS: PlaygroundComponent[] = [');
  if (arrayStartIdx === -1) {
    throw new Error("Could not find PLAYGROUND_COMPONENTS array in registry.");
  }
  
  const arrayEndIdx = registryContent.indexOf('];', arrayStartIdx);
  if (arrayEndIdx === -1) {
    throw new Error("Could not find end of PLAYGROUND_COMPONENTS array.");
  }

  // Insert entry before the closing bracket
  registryContent = registryContent.slice(0, arrayEndIdx) + entryStr + '\n' + registryContent.slice(arrayEndIdx);
  fs.writeFileSync(registryPath, registryContent, 'utf8');
  console.log(`✓ Registered ${componentName} in src/config/playground.ts`);
} catch (err) {
  console.error("Error updating registry:", err);
  process.exit(1);
}

// 2. Generate Route page.tsx
try {
  if (!fs.existsSync(routePageDir)) {
    fs.mkdirSync(routePageDir, { recursive: true });
  }

  const demoCompName = `${componentName}Demo`;
  const demoCompImportName = `${componentSlug.replace(/-/g, '_')}_demo`;

  const routeContent = `import { ${demoCompName} } from "@/components/layout/${demoCompImportName}";

export const metadata = {
  title: "${componentName} Playground",
  description: "Test and configure ${componentName} component with visual sliders.",
};

export default function ${componentName}PlaygroundPage() {
  return <${demoCompName} />;
}
`;

  fs.writeFileSync(routePagePath, routeContent, 'utf8');
  console.log(`✓ Created route page at ${routePagePath}`);
} catch (err) {
  console.error("Error creating route page:", err);
  process.exit(1);
}

// 3. Generate Boilerplate Demo Component
try {
  const demoCompName = `${componentName}Demo`;
  const demoContent = `"use client";

import * as React from "react";
import { Button, Card, Chip, Switch } from "@heroui/react";
import { Sliders, GalleryHorizontal, Layers, Copy, Check } from "lucide-react";
// Import the component under test
// import { ${componentName} } from "${importPath}";

export function ${demoCompName}() {
  const [activeTab, setActiveTab] = React.useState<"playground" | "gallery" | "specs">("playground");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Playground state placeholders (Modify to match component props)
  const [sampleProp, setSampleProp] = React.useState(true);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlaygroundCode = () => {
    return \`<${componentName}
  sampleProp=\${sampleProp}
/>\`;
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16">
      {/* Page Heading */}
      <div className="flex flex-col gap-2">
        <Chip className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" variant="soft">
          Developer Tools
        </Chip>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
          ${componentName} Sandbox
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-3xl text-sm leading-relaxed">
          Interactive sandbox for testing and configuring the <code className="text-indigo-400 font-mono">${componentName}</code> component.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab("playground")}
          className={\`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer \${
            activeTab === "playground"
              ? "border-indigo-500 text-indigo-500 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }\`}
        >
          <Sliders className="w-4 h-4" />
          Interactive Playground
        </button>
        <button
          onClick={() => setActiveTab("gallery")}
          className={\`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer \${
            activeTab === "gallery"
              ? "border-indigo-500 text-indigo-500 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }\`}
        >
          <GalleryHorizontal className="w-4 h-4" />
          Preconfigured Component
        </button>
        <button
          onClick={() => setActiveTab("specs")}
          className={\`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer \${
            activeTab === "specs"
              ? "border-indigo-500 text-indigo-500 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }\`}
        >
          <Layers className="w-4 h-4" />
          Specifications & API
        </button>
      </div>

      {/* Tab Panel: Playground */}
      {activeTab === "playground" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel */}
          <Card variant="secondary" className="lg:col-span-5 flex flex-col gap-5 p-6 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Card.Header className="p-0 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <Card.Title className="text-base font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Properties
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-0 flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Sample Switch</span>
                <Switch isSelected={sampleProp} onChange={setSampleProp}>
                  <Switch.Content className="flex items-center">
                    <Switch.Control className="h-5 w-8 bg-zinc-300 dark:bg-zinc-700 data-[selected=true]:bg-indigo-500">
                      <Switch.Thumb className="h-4 w-4 bg-white" />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>
            </Card.Content>
          </Card>

          {/* Live Preview Container */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs relative min-h-[220px] flex items-center justify-center">
              <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 select-none">
                Live Interactive Preview
              </span>
              <div className="w-full text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
                {/* Render the actual component here */}
                <p className="text-sm text-zinc-400 font-medium">
                  {/* <${componentName} sampleProp={sampleProp} /> */}
                  [ ${componentName} Component Live Render Mock ]
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Value of sampleProp: {sampleProp ? "true" : "false"}
                </p>
              </div>
            </div>

            {/* Generated Code */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-zinc-500">React Code Usage</span>
                <button
                  onClick={() => handleCopy(getPlaygroundCode(), "playground")}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedId === "playground" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed shadow-lg">
                {getPlaygroundCode()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Preconfigured Gallery */}
      {activeTab === "gallery" && (
        <div className="flex flex-col gap-8">
          <Card variant="default" className="p-5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
            <Card.Header className="p-0">
              <Card.Title className="text-base font-bold">Default Angle</Card.Title>
              <Card.Description className="text-xs">Initial standard variant configuration.</Card.Description>
            </Card.Header>
            <Card.Content className="p-0 mt-4 bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-200/40 dark:border-zinc-800/40 rounded-lg">
              {/* <${componentName} sampleProp={true} /> */}
              <div className="text-center py-4 text-xs text-zinc-500">[ Default Angle Live Render ]</div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Tab Panel: Specs */}
      {activeTab === "specs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="default" className="p-5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
            <Card.Header className="p-0">
              <Card.Title className="text-base font-bold">Properties</Card.Title>
            </Card.Header>
            <Card.Content className="p-0 mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-500 dark:text-zinc-400">
                <thead className="text-[10px] uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                  <tr>
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Prop</th>
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Type</th>
                    <th className="px-4 py-2 border border-zinc-200 dark:border-zinc-800">Default</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2 font-mono text-indigo-400 font-semibold border-r border-zinc-200 dark:border-zinc-800">sampleProp</td>
                    <td className="px-4 py-2 border-r border-zinc-200 dark:border-zinc-800"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">boolean</code></td>
                    <td className="px-4 py-2 border-r border-zinc-200 dark:border-zinc-800"><code className="text-zinc-500">true</code></td>
                  </tr>
                </tbody>
              </table>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
