import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({plugins:[react(),tailwindcss()],server:{watch:{ignored:['**/server/**','**/tests/**','**/.runtime/**','**/docs/**','**/test-results/**']},proxy:{'/api':'http://127.0.0.1:4017'}},build:{rollupOptions:{output:{manualChunks(id){if(id.includes('node_modules')){if(/recharts|d3-|victory|decimal|react-smooth/.test(id))return 'charts';if(id.includes('lucide-react'))return 'icons';return 'vendor';}}}}}});
