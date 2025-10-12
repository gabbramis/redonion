export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-red-500 font-bold text-2xl mb-4">RedOnion</h3>
            <p className="text-sm">
              Agencia de marketing internacional que ofrece estrategias audaces y resultados medibles en todo el mundo.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-500 transition-colors">Marketing Digital</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Estrategia de Marca</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Creación de Contenido</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Redes Sociales</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-500 transition-colors">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Carreras</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Casos de Estudio</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Conecta</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-red-500 transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-sm text-center">
          <p>&copy; 2025 RedOnion Agencia Internacional de Marketing. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
