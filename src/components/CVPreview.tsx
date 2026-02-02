import { CVData } from "@/types/cv";
import { Download, RefreshCw, Pencil, Save, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditSectionModal } from "./EditSectionModal";
import { useState, useRef } from "react";
import { PdfTextBlock, usePdfExport } from "@/hooks/usePdfExport";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface CVPreviewProps {
  data: CVData;
  onReset: () => void;
  onUpdate: (data: CVData) => void;
  onSave?: () => void;
}

type EditSection = "header" | "sumario" | "sistemas" | "skills" | "competencias" | "realizacoes" | "educacao" | "experiencias" | null;

export function CVPreview({ data, onReset, onUpdate, onSave }: CVPreviewProps) {
  const [editSection, setEditSection] = useState<EditSection>(null);
  const cvRef = useRef<HTMLDivElement>(null);
  const { exportTextPdf, isExporting } = usePdfExport({ filename: `curriculo-${data.nome.toLowerCase().replace(/\s+/g, '-')}.pdf` });
  const isMobile = useIsMobile();

  const handleExportPdf = () => {
    const filename = `curriculo-${data.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    const blocks: PdfTextBlock[] = [];

    // Header - Nome em negrito uppercase
    blocks.push({ type: "title", text: data.nome });
    // Cargos abaixo do nome
    blocks.push({ type: "subtitle", text: data.cargos });
    // Linha de contato com links em azul
    blocks.push({
      type: "contact-line",
      text: [data.telefone, data.email, data.linkedin].filter(Boolean).join(" | "),
    });

    // Sumário - Cabeçalho azul + parágrafos + bullets
    blocks.push({ type: "heading", text: "Sumário" });
    for (const p of data.sumario.paragrafos) {
      blocks.push({ type: "paragraph", text: p });
    }
    for (const b of data.sumario.bullets) {
      blocks.push({ type: "bullet", text: b });
    }

    // SISTEMAS | SKILLS | COMPETÊNCIAS - 3 colunas lado a lado
    blocks.push({
      type: "three-columns",
      columns: [
        { title: "Sistemas", items: data.sistemas },
        { title: "Skills", items: data.skills },
        { title: "Competências", items: data.competencias },
      ],
    });

    // Realizações - Full width com bullets
    blocks.push({ type: "heading", text: "Realizações" });
    for (const s of data.realizacoes) {
      blocks.push({ type: "bullet", text: s });
    }

    // Educação
    blocks.push({ type: "heading", text: "Educação & Qualificações" });
    for (const item of data.educacao) {
      if (!item.curso?.trim()) continue;
      blocks.push({
        type: "bullet",
        text: `${item.curso}${item.instituicao?.trim() ? ` – ${item.instituicao}` : ""}`,
      });
    }

    // Experiências Profissionais
    blocks.push({ type: "heading", text: "Experiências Profissionais" });
    for (const exp of data.experiencias) {
      // Empresa em azul + cargo em negrito
      blocks.push({
        type: "subheading",
        text: `${exp.empresa} — ${exp.cargo}`,
      });
      if (exp.periodo?.trim()) {
        blocks.push({ type: "paragraph", text: exp.periodo.toUpperCase() });
      }
      for (const b of exp.bullets) {
        blocks.push({ type: "bullet", text: b });
      }
    }

    exportTextPdf({ filename, blocks });
  };

  const handleSave = (section: EditSection, newData: any) => {
    if (!section) return;

    if (section === "header") {
      onUpdate({ ...data, ...newData });
    } else if (section === "sumario") {
      onUpdate({ ...data, sumario: newData });
    } else {
      onUpdate({ ...data, [section]: newData });
    }
  };

  const getModalData = () => {
    switch (editSection) {
      case "header":
        return { nome: data.nome, cargos: data.cargos, telefone: data.telefone, email: data.email, linkedin: data.linkedin };
      case "sumario":
        return data.sumario;
      case "sistemas":
        return data.sistemas;
      case "skills":
        return data.skills;
      case "competencias":
        return data.competencias;
      case "realizacoes":
        return data.realizacoes;
      case "educacao":
        return data.educacao;
      case "experiencias":
        return data.experiencias;
      default:
        return null;
    }
  };

  const getModalType = (): "header" | "sumario" | "list" | "education" | "experience" => {
    switch (editSection) {
      case "header": return "header";
      case "sumario": return "sumario";
      case "educacao": return "education";
      case "experiencias": return "experience";
      default: return "list";
    }
  };

  const getModalTitle = () => {
    switch (editSection) {
      case "header": return "Cabeçalho";
      case "sumario": return "Sumário";
      case "sistemas": return "Sistemas";
      case "skills": return "Skills";
      case "competencias": return "Competências";
      case "realizacoes": return "Realizações";
      case "educacao": return "Educação";
      case "experiencias": return "Experiências";
      default: return "";
    }
  };

  const EditButton = ({ section }: { section: EditSection }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 opacity-50 hover:opacity-100 print:hidden"
      onClick={() => setEditSection(section)}
    >
      <Pencil className="w-3 h-3" />
    </Button>
  );

  // Mobile Layout - Premium Modal Style (same as ATS)
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between py-4 px-4 print:hidden">
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 text-sm h-10">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <span className="text-sm text-muted-foreground font-medium">Currículo Personalizado</span>
          <div className="w-20" />
        </div>

        {/* Content Area */}
        <div className="flex-1 px-4 pb-4 flex flex-col gap-5">
          
          {/* Preview Card - Premium Modal Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 p-3 shadow-lg"
          >
            {/* Preview Label */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pré-visualização
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/60">
                Role para ver mais ↓
              </span>
            </div>

            {/* Scrollable Preview Container */}
            <div 
              className="relative bg-white rounded-xl overflow-hidden shadow-inner"
              style={{ maxHeight: '55vh' }}
            >
              <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '55vh' }}>
                <div ref={cvRef} className="p-5 text-black space-y-4">
                  {/* Header */}
                  <div className="pb-2 border-b-0">
                    <h1 className="text-lg font-bold text-black uppercase">{data.nome}</h1>
                    <p className="text-xs text-black mt-0.5">{data.cargos}</p>
                    <p className="text-[10px] text-black mt-1">
                      <span className="underline">{data.telefone}</span> | {data.email} | <span className="text-blue-600 underline">{data.linkedin}</span>
                    </p>
                  </div>

                  {/* Sumário */}
                  <section>
                    <h2 className="text-xs font-bold text-blue-600 uppercase mb-1">SUMÁRIO</h2>
                    {data.sumario.paragrafos.map((p, i) => (
                      <p key={i} className="text-[10px] text-black leading-relaxed text-justify">{p}</p>
                    ))}
                  </section>

                  {/* Grid: Sistemas, Skills, Competências */}
                  <div className="grid grid-cols-3 gap-2 text-[9px]">
                    <section>
                      <h2 className="text-[10px] font-bold text-blue-600 uppercase mb-1">SISTEMAS</h2>
                      <ul className="space-y-0.5">
                        {data.sistemas.slice(0, 5).map((item, i) => (
                          <li key={i} className="text-black">• {item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h2 className="text-[10px] font-bold text-blue-600 uppercase mb-1">SKILLS</h2>
                      <ul className="space-y-0.5">
                        {data.skills.slice(0, 5).map((item, i) => (
                          <li key={i} className="text-black">• {item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h2 className="text-[10px] font-bold text-blue-600 uppercase mb-1">COMPETÊNCIAS</h2>
                      <ul className="space-y-0.5">
                        {data.competencias.slice(0, 5).map((item, i) => (
                          <li key={i} className="text-black">• {item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {/* Realizações */}
                  <section>
                    <h2 className="text-xs font-bold text-blue-600 uppercase mb-1">REALIZAÇÕES</h2>
                    <ul className="space-y-0.5">
                      {data.realizacoes.slice(0, 4).map((item, i) => (
                        <li key={i} className="text-[10px] text-black">• {item}</li>
                      ))}
                    </ul>
                  </section>

                  {/* Educação */}
                  <section>
                    <h2 className="text-xs font-bold text-blue-600 uppercase mb-1">EDUCAÇÃO</h2>
                    <ul className="space-y-0.5">
                      {data.educacao.filter(e => e.curso?.trim()).slice(0, 3).map((item, i) => (
                        <li key={i} className="text-[10px] text-black">• {item.curso}{item.instituicao?.trim() ? ` – ${item.instituicao}` : ''}</li>
                      ))}
                    </ul>
                  </section>

                  {/* Experiências */}
                  <section>
                    <h2 className="text-xs font-bold text-blue-600 uppercase mb-1">EXPERIÊNCIAS</h2>
                    <div className="space-y-2">
                      {data.experiencias.slice(0, 2).map((exp, i) => (
                        <div key={i}>
                          <p className="text-[10px]">
                            <span className="text-blue-600 underline">{exp.empresa}</span>
                            <span className="text-black"> — </span>
                            <span className="font-bold text-black">{exp.cargo}</span>
                          </p>
                          {exp.periodo && <p className="text-[9px] text-gray-600 uppercase">{exp.periodo}</p>}
                          <ul className="mt-0.5 space-y-0.5">
                            {exp.bullets.slice(0, 2).map((bullet, j) => (
                              <li key={j} className="text-[9px] text-black">• {bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Bottom Fade */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-3 print:hidden"
          >
            <Button 
              variant="glow" 
              onClick={handleExportPdf} 
              disabled={isExporting} 
              className="w-full h-14 gap-3 rounded-2xl text-base font-semibold shadow-lg"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isExporting ? "Exportando..." : "Exportar PDF"}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setEditSection("header")} 
                className="h-12 gap-2 rounded-xl bg-card/50 border-border/40 hover:bg-card"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              {onSave && (
                <Button 
                  variant="outline" 
                  onClick={onSave} 
                  className="h-12 gap-2 rounded-xl bg-card/50 border-border/40 hover:bg-card"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Edit Modal */}
        {editSection && (
          <EditSectionModal
            open={!!editSection}
            onClose={() => setEditSection(null)}
            title={getModalTitle()}
            type={getModalType()}
            data={getModalData()}
            onSave={(newData) => handleSave(editSection, newData)}
          />
        )}
      </div>
    );
  }

  // Desktop Layout - Original
  const DesktopEditButton = ({ section }: { section: EditSection }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 opacity-50 hover:opacity-100 print:hidden"
      onClick={() => setEditSection(section)}
    >
      <Pencil className="w-3 h-3" />
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3 print:hidden animate-fade-in">
        <Button variant="glow" onClick={handleExportPdf} disabled={isExporting} className="flex-1">
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? "Exportando..." : "Exportar PDF"}
        </Button>
        {onSave && (
          <Button variant="secondary" onClick={onSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        )}
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="w-4 h-4" />
          Novo Currículo
        </Button>
      </div>

      {/* CV Document */}
      <div ref={cvRef} className="bg-card rounded-xl p-8 shadow-card border border-border/50 space-y-8 animate-slide-up print:bg-white print:text-black print:shadow-none print:border-none print:p-0">

        {/* Header */}
        <div className="pb-4 border-b-0 relative group">
          <div className="absolute top-0 right-0 print:hidden">
            <DesktopEditButton section="header" />
          </div>
          <h1 className="text-2xl font-bold text-foreground print:text-black uppercase">
            {data.nome}
          </h1>
          <p className="text-sm text-foreground mt-1 print:text-black">
            {data.cargos}
          </p>
          <p className="text-sm text-foreground mt-2 print:text-black">
            <span className="underline">{data.telefone}</span> | {data.email} | <span className="text-blue-600 underline print:text-blue-600">{data.linkedin}</span>
          </p>
        </div>

        {/* SUMÁRIO */}
        <section className="relative group">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-blue-600 uppercase print:text-blue-600">SUMÁRIO</h2>
            <DesktopEditButton section="sumario" />
          </div>
          <div className="mt-2 space-y-3">
            {data.sumario.paragrafos.map((p, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed print:text-black text-justify">
                {p}
              </p>
            ))}
            {data.sumario.bullets.length > 0 && (
              <ul className="mt-3 space-y-1 list-none">
                {data.sumario.bullets.map((bullet, i) => (
                  <li key={i} className="text-sm text-foreground print:text-black pl-4 relative before:content-['•'] before:absolute before:left-0">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* SISTEMAS, SKILLS, COMPETÊNCIAS - Grid */}
        <div className="grid grid-cols-3 gap-4">
          <section className="relative group">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-600 uppercase print:text-blue-600">SISTEMAS</h2>
              <DesktopEditButton section="sistemas" />
            </div>
            <ul className="mt-2 space-y-1 list-none">
              {data.sistemas.map((item, i) => (
                <li key={i} className="text-sm text-foreground print:text-black pl-4 relative before:content-['•'] before:absolute before:left-0">{item}</li>
              ))}
            </ul>
          </section>

          <section className="relative group">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-600 uppercase print:text-blue-600">SKILLS</h2>
              <DesktopEditButton section="skills" />
            </div>
            <ul className="mt-2 space-y-1 list-none">
              {data.skills.map((item, i) => (
                <li key={i} className="text-sm text-foreground print:text-black pl-4 relative before:content-['•'] before:absolute before:left-0">{item}</li>
              ))}
            </ul>
          </section>

          <section className="relative group">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-600 uppercase print:text-blue-600">COMPETÊNCIAS</h2>
              <DesktopEditButton section="competencias" />
            </div>
            <ul className="mt-2 space-y-1 list-none">
              {data.competencias.map((item, i) => (
                <li key={i} className="text-sm text-foreground print:text-black pl-4 relative before:content-['•'] before:absolute before:left-0">{item}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* REALIZAÇÕES */}
        <section className="relative group">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-blue-600 uppercase print:text-blue-600">REALIZAÇÕES</h2>
            <DesktopEditButton section="realizacoes" />
          </div>
          <ul className="mt-2 space-y-1 list-none">
            {data.realizacoes.map((item, i) => (
              <li key={i} className="text-sm text-foreground print:text-black pl-4 relative before:content-['•'] before:absolute before:left-0">{item}</li>
            ))}
          </ul>
        </section>

        {/* EDUCAÇÃO & QUALIFICAÇÕES */}
        <section className="relative group">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-blue-600 uppercase print:text-blue-600">EDUCAÇÃO & QUALIFICAÇÕES</h2>
            <DesktopEditButton section="educacao" />
          </div>
          <ul className="mt-2 space-y-1 list-none">
            {data.educacao
              .filter(item => item.curso && item.curso.trim().length > 3)
              .map((item, i) => (
                <li key={i} className="text-sm text-foreground print:text-black pl-4 relative before:content-['•'] before:absolute before:left-0">
                  {item.curso}{item.instituicao && item.instituicao.trim() ? ` – ${item.instituicao}` : ''}
                </li>
              ))}
          </ul>
        </section>

        {/* EXPERIÊNCIAS PROFISSIONAIS */}
        <section className="relative group">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-blue-600 uppercase print:text-blue-600">EXPERIÊNCIAS PROFISSIONAIS</h2>
            <DesktopEditButton section="experiencias" />
          </div>
          <div className="mt-3 space-y-6">
            {data.experiencias.map((exp, i) => (
              <div key={i}>
                <p className="text-sm">
                  <span className="text-blue-600 underline print:text-blue-600">{exp.empresa}</span>
                  <span className="text-foreground print:text-black"> — </span>
                  <span className="font-bold text-foreground print:text-black">{exp.cargo}</span>
                </p>
                {exp.periodo && (
                  <p className="text-sm text-foreground print:text-black uppercase mt-1">
                    {exp.periodo}
                  </p>
                )}
                <ul className="mt-2 space-y-1 list-none">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} className="text-sm text-foreground print:text-black pl-4 relative before:content-['•'] before:absolute before:left-0">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      {editSection && (
        <EditSectionModal
          open={!!editSection}
          onClose={() => setEditSection(null)}
          title={getModalTitle()}
          type={getModalType()}
          data={getModalData()}
          onSave={(newData) => handleSave(editSection, newData)}
        />
      )}
    </div>
  );
}
