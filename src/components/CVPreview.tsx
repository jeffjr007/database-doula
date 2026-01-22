import { CVData } from "@/types/cv";
import { Download, RefreshCw, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditSectionModal } from "./EditSectionModal";
import { useState } from "react";

interface CVPreviewProps {
  data: CVData;
  onReset: () => void;
  onUpdate: (data: CVData) => void;
  onSave?: () => void;
}

type EditSection = "header" | "sumario" | "sistemas" | "skills" | "competencias" | "realizacoes" | "educacao" | "experiencias" | null;

export function CVPreview({ data, onReset, onUpdate, onSave }: CVPreviewProps) {
  const [editSection, setEditSection] = useState<EditSection>(null);

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3 print:hidden animate-fade-in">
        <Button variant="glow" onClick={handlePrint} className="flex-1">
          <Download className="w-4 h-4" />
          Exportar PDF
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
      <div className="bg-card rounded-xl p-8 shadow-card border border-border/50 space-y-8 animate-slide-up print:bg-white print:text-black print:shadow-none print:border-none print:p-0">

        {/* Header */}
        <div className="pb-4 border-b-0 relative group">
          <div className="absolute top-0 right-0 print:hidden">
            <EditButton section="header" />
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
            <EditButton section="sumario" />
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
              <EditButton section="sistemas" />
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
              <EditButton section="skills" />
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
              <EditButton section="competencias" />
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
            <EditButton section="realizacoes" />
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
            <EditButton section="educacao" />
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
            <EditButton section="experiencias" />
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
