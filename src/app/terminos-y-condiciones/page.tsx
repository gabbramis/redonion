"use client";

import { motion } from "framer-motion";

const TermsOfServicePage = () => {
  const companyName = "Red Onion";
  const lastUpdated = "20 de Octubre de 2025";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 py-20 px-6 md:px-20">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Términos de Servicio de {companyName}
        </h1>
        <p className="text-neutral-400 text-sm uppercase tracking-wide mb-6">
          Última actualización: {lastUpdated}
        </p>
        <p className="text-neutral-300 text-lg leading-relaxed max-w-3xl mx-auto">
          Los presentes Términos de Servicio (en adelante, los “Términos”) regulan la relación entre{" "}
          <span className="text-white font-semibold">{companyName}</span>, agencia especializada en
          marketing digital, branding y comunicación, y cualquier persona física o jurídica que
          contrate sus servicios (en adelante, el “Cliente”).
        </p>
      </motion.header>

      {/* BODY */}
      <div className="max-w-4xl mx-auto space-y-14">
        {sections.map((section, index) => (
          <motion.section
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="border-l border-neutral-800 pl-6"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 tracking-tight">
              {section.title}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-neutral-400 leading-relaxed mb-4 text-base md:text-lg"
                dangerouslySetInnerHTML={{ __html: p }}
              />
            ))}
          </motion.section>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="max-w-4xl mx-auto text-center mt-24 text-neutral-600 text-sm border-t border-neutral-800 pt-8">
        © {new Date().getFullYear()} {companyName}. Todos los derechos reservados.
      </footer>
    </div>
  );
};

const sections = [
  {
    title: "A. Propósito y Alcance",
    paragraphs: [
      `Los presentes Términos de Servicio (en adelante, los “Términos”) regulan la relación entre 
      <strong>Red Onion</strong> y cualquier persona física o jurídica que contrate sus servicios 
      (en adelante, el “Cliente”). Al acceder, contratar o utilizar cualquiera de los servicios ofrecidos 
      por <strong>Red Onion</strong>, el Cliente acepta haber leído, comprendido y estar legalmente obligado 
      por estos Términos en su totalidad. Cualquier modificación, excepción o acuerdo adicional deberá 
      realizarse por escrito y contar con la aprobación de ambas partes.`,
    ],
  },
  {
    title: "B. Propiedad Intelectual y Derechos de Uso",
    paragraphs: [
      `Todo contenido, diseño, logotipo, pieza audiovisual, material gráfico, texto, estrategia, concepto 
      creativo, identidad visual, desarrollo digital o cualquier otro elemento producido por 
      <strong>Red Onion</strong> (en adelante, el “Material”) es y seguirá siendo propiedad intelectual 
      exclusiva de la agencia, salvo que se acuerde expresamente por escrito su cesión o transferencia.`,
      `El Cliente obtiene únicamente un derecho de uso limitado, no exclusivo y no transferible, destinado 
      exclusivamente a los fines definidos en la propuesta o contrato. Queda estrictamente prohibida la 
      modificación, reproducción, redistribución o utilización del Material sin autorización previa por 
      escrito. En caso de terminación del contrato o incumplimiento por parte del Cliente, 
      <strong> Red Onion</strong> podrá suspender, retirar o desactivar los materiales creados bajo su 
      gestión sin previo aviso.`,
    ],
  },
  {
    title: "C. Naturaleza del Servicio y Alcance del Marketing Orgánico",
    paragraphs: [
      `<strong>Red Onion</strong> ofrece servicios profesionales de marketing digital que incluyen, entre otros, 
      gestión de redes sociales, desarrollo de branding, diseño estratégico, campañas digitales y creación de 
      contenido orgánico.`,
      `El Cliente comprende que los resultados asociados al crecimiento orgánico dependen de múltiples factores 
      externos, como el comportamiento del algoritmo de las plataformas, la interacción del público, la competencia, 
      la coyuntura del mercado y la calidad del producto o servicio ofrecido. Por tanto, 
      <strong>Red Onion</strong> no garantiza resultados específicos en ventas, alcance, interacción, posicionamiento 
      o crecimiento de audiencia.`,
    ],
  },
  {
    title: "D. Tiempos de Ejecución, Plazos y Resultados",
    paragraphs: [
      `Los plazos de ejecución, entrega o desarrollo indicados en las propuestas comerciales son estimaciones 
      aproximadas sujetas a cambios. Dichos plazos pueden variar por motivos operativos, revisiones solicitadas 
      por el Cliente, falta de información o aprobación de materiales, o causas externas.`,
      `<strong>Red Onion</strong> desarrolla estrategias que requieren análisis, constancia y evaluación continua; 
      por tanto, los resultados se manifiestan de forma gradual. El Cliente reconoce que los procesos de marketing, 
      comunicación y posicionamiento no garantizan viralización ni resultados inmediatos.`,
    ],
  },
  {
    title: "E. Inversión, Pagos y Destino de Fondos",
    paragraphs: [
      `El Cliente deberá realizar los pagos correspondientes dentro de los plazos establecidos en la propuesta 
      o factura. Los montos abonados corresponden a honorarios profesionales y no incluyen derechos de propiedad 
      sobre los materiales desarrollados, salvo pacto escrito en contrario.`,
      `Los costos adicionales generados por plataformas externas (como Meta, Google Ads, TikTok u otras) serán 
      asumidos por el Cliente. <strong>Red Onion</strong> no se responsabiliza por variaciones en políticas de 
      plataformas, fluctuaciones del mercado o alteraciones en los costos de publicidad digital.`,
    ],
  },
  {
    title: "F. Reportes, Estadísticas y Análisis de Resultados",
    paragraphs: [
      `<strong>Red Onion</strong> proporcionará informes y estadísticas según los parámetros establecidos en cada 
      contrato o plan de servicios. Dichos reportes son de carácter informativo y tienen como fin evaluar el desempeño 
      de las estrategias implementadas. El Cliente acepta que las métricas entregadas no constituyen una garantía de 
      resultados futuros ni un compromiso contractual.`,
    ],
  },
  {
    title: "G. Confidencialidad y Uso de Información",
    paragraphs: [
      `Ambas partes se comprometen a mantener la confidencialidad sobre toda la información, documentación, estrategias, 
      datos o materiales compartidos durante la relación comercial. Ninguna de las partes podrá divulgar información 
      confidencial sin consentimiento previo y por escrito de la otra.`,
      `<strong>Red Onion</strong> podrá utilizar materiales de proyectos finalizados con fines de portafolio, 
      presentación comercial o promoción, siempre que no se revele información sensible del Cliente.`,
    ],
  },
  {
    title: "H. Responsabilidad y Limitaciones",
    paragraphs: [
      `<strong>Red Onion</strong> no será responsable por pérdidas económicas, daños indirectos, lucro cesante, pérdida 
      de oportunidades comerciales o perjuicios derivados de la implementación de estrategias o campañas.`,
      `El Cliente reconoce que la comunicación digital implica exposición pública, por lo que las reacciones, comentarios 
      o comportamientos de los usuarios están fuera del control de la agencia. La responsabilidad total de 
      <strong>Red Onion</strong> se limitará al valor total efectivamente abonado por los servicios contratados.`,
    ],
  },
  {
    title: "I. Rescisión y Finalización de Servicios",
    paragraphs: [
      `Cualquiera de las partes podrá poner fin a la relación contractual notificando a la otra con al menos quince (15) 
      días de anticipación. En caso de incumplimiento de pago, falta de entrega de materiales o incumplimiento de 
      obligaciones por parte del Cliente, <strong>Red Onion</strong> podrá suspender los servicios de manera inmediata 
      y conservar la propiedad del material desarrollado hasta que se regularice la situación.`,
      `Los pagos realizados no serán reembolsables en ningún caso.`,
    ],
  },
  {
    title: "J. Modificaciones y Actualizaciones",
    paragraphs: [
      `<strong>Red Onion</strong> se reserva el derecho de modificar, actualizar o complementar estos Términos en cualquier 
      momento y sin necesidad de previo aviso. Las modificaciones entrarán en vigor inmediatamente después de su publicación 
      o comunicación al Cliente. El uso continuado de los servicios implica la aceptación de las mismas.`,
    ],
  },
  {
    title: "K. Jurisdicción y Ley Aplicable",
    paragraphs: [
      `Estos Términos se interpretarán y aplicarán conforme a los principios generales del derecho internacional y las 
      buenas prácticas comerciales. En caso de controversia, las partes procurarán resolverla de manera amistosa y, en 
      su defecto, mediante los mecanismos de resolución de conflictos apropiados.`,
    ],
  },
];

export default TermsOfServicePage;
