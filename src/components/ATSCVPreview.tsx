import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  Save,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import { ATSCVData, ATSCVLabels, ATSExperienciaItem, ATSEducacaoItem, IdiomaItem } from "@/types/ats-cv";
import { motion, AnimatePresence } from "framer-motion";
import { PdfTextBlock, usePdfExport } from "@/hooks/usePdfExport";
import { useIsMobile } from "@/hooks/use-mobile";

interface ATSCVPreviewProps {
  data: ATSCVData;
  onReset: () => void;
  onSave?: () => void;
  onDataChange?: (data: ATSCVData) => void;
}

const defaultLabels: ATSCVLabels = {
  telefone: "Telefone",
  localizacao: "Localização",
  email: "E-mail",
  linkedin: "Linkedin",
  experiencias: "Experiências",
  educacao: "Educação",
  idiomas: "Idiomas"
};

// Editable text component with inline editing
function EditableText({
  value,
  onChange,
  className = "",
  isEditing,
  multiline = false,
  placeholder = ""
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isEditing: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  if (!isEditing) {
    return <span className={className}>{value || placeholder}</span>;
  }

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-yellow-50 border-yellow-300 text-black min-h-[60px] ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-yellow-50 border-yellow-300 text-black h-auto py-0.5 px-1 ${className}`}
      placeholder={placeholder}
    />
  );
}

export function ATSCVPreview({ data, onReset, onSave, onDataChange }: ATSCVPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ATSCVData>(data);
  const cvRef = useRef<HTMLDivElement>(null);
  const { exportTextPdf, isExporting } = usePdfExport({ filename: `cv-ats-${data.nome.toLowerCase().replace(/\s+/g, '-')}.pdf` });
  const isMobile = useIsMobile();

  const labels = editData.labels || defaultLabels;

  const handleExportPdf = () => {
    const filename = `cv-ats-${data.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    const currentData = isEditing ? editData : data;
    const currentLabels = currentData.labels || defaultLabels;

    const blocks: PdfTextBlock[] = [];

    // Header info - right aligned
    const headerLines: string[] = [];
    if (currentData.telefone) {
      headerLines.push(`${currentLabels.telefone} : ${currentData.telefone}`);
    }
    if (currentData.localizacao) {
      headerLines.push(`${currentLabels.localizacao} : ${currentData.localizacao}`);
    }
    if (currentData.email) {
      headerLines.push(`${currentLabels.email} : ${currentData.email}`);
    }
    if (currentData.linkedin) {
      headerLines.push(`${currentLabels.linkedin} : ${currentData.linkedin}`);
    }
    if (currentData.nacionalidade || currentData.idade) {
      headerLines.push(
        `${(currentData.nacionalidade || "").toUpperCase()}${currentData.nacionalidade && currentData.idade ? ", " : ""}${currentData.idade ? `${currentData.idade} ANOS.` : ""}`
      );
    }
    if (headerLines.length > 0) {
      blocks.push({ type: "right-align", lines: headerLines });
    }

    // Name
    blocks.push({ type: "spacer", size: 6 });
    blocks.push({ type: "title", text: currentData.nome });

    // Experiências
    if (currentData.experiencias.length > 0) {
      blocks.push({ type: "heading", text: currentLabels.experiencias });
      for (const exp of currentData.experiencias) {
        // Experience header: EMPRESA, Local — Cargo
        blocks.push({
          type: "subheading",
          text: `${exp.empresa}${exp.localizacao ? `, ${exp.localizacao}` : ""}  —  ${exp.cargo}`,
        });
        if (exp.periodo?.trim()) {
          blocks.push({ type: "paragraph", text: exp.periodo.toUpperCase() });
        }
        for (const b of exp.bullets) {
          blocks.push({ type: "bullet", text: b });
        }
      }
    }

    // Educação
    if (currentData.educacao.length > 0) {
      blocks.push({ type: "heading", text: currentLabels.educacao });
      for (const item of currentData.educacao) {
        if (!item.curso?.trim()) continue;
        blocks.push({
          type: "bullet",
          text: `${item.instituicao || ""}${item.instituicao ? ", " : ""}${item.curso}`,
        });
      }
    }

    // Idiomas
    if (currentData.idiomas.length > 0) {
      blocks.push({ type: "heading", text: currentLabels.idiomas });
      for (const item of currentData.idiomas) {
        blocks.push({ type: "bullet", text: `${item.idioma} - ${item.nivel}` });
      }
    }

    exportTextPdf({ filename, blocks });
  };

  const startEditing = () => {
    setEditData({ ...data });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (onDataChange) {
      onDataChange(editData);
    }
    setIsEditing(false);
  };

  const updateField = (field: keyof ATSCVData, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const updateLabel = (field: keyof ATSCVLabels, value: string) => {
    setEditData(prev => ({
      ...prev,
      labels: { ...defaultLabels, ...prev.labels, [field]: value }
    }));
  };

  const updateExperiencia = (index: number, field: keyof ATSExperienciaItem, value: any) => {
    const newExp = [...editData.experiencias];
    newExp[index] = { ...newExp[index], [field]: value };
    updateField('experiencias', newExp);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const newExp = [...editData.experiencias];
    const newBullets = [...newExp[expIndex].bullets];
    newBullets[bulletIndex] = value;
    newExp[expIndex] = { ...newExp[expIndex], bullets: newBullets };
    updateField('experiencias', newExp);
  };

  const addBullet = (expIndex: number) => {
    const newExp = [...editData.experiencias];
    newExp[expIndex] = { ...newExp[expIndex], bullets: [...newExp[expIndex].bullets, ""] };
    updateField('experiencias', newExp);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newExp = [...editData.experiencias];
    const newBullets = newExp[expIndex].bullets.filter((_, i) => i !== bulletIndex);
    newExp[expIndex] = { ...newExp[expIndex], bullets: newBullets };
    updateField('experiencias', newExp);
  };

  const addExperiencia = () => {
    updateField('experiencias', [
      ...editData.experiencias,
      { empresa: "", localizacao: "", cargo: "", periodo: "", bullets: [""] }
    ]);
  };

  const removeExperiencia = (index: number) => {
    updateField('experiencias', editData.experiencias.filter((_, i) => i !== index));
  };

  const updateEducacao = (index: number, field: keyof ATSEducacaoItem, value: string) => {
    const newEdu = [...editData.educacao];
    newEdu[index] = { ...newEdu[index], [field]: value };
    updateField('educacao', newEdu);
  };

  const addEducacao = () => {
    updateField('educacao', [...editData.educacao, { instituicao: "", curso: "" }]);
  };

  const removeEducacao = (index: number) => {
    updateField('educacao', editData.educacao.filter((_, i) => i !== index));
  };

  const updateIdioma = (index: number, field: keyof IdiomaItem, value: string) => {
    const newIdiomas = [...editData.idiomas];
    newIdiomas[index] = { ...newIdiomas[index], [field]: value };
    updateField('idiomas', newIdiomas);
  };

  const addIdioma = () => {
    updateField('idiomas', [...editData.idiomas, { idioma: "", nivel: "" }]);
  };

  const removeIdioma = (index: number) => {
    updateField('idiomas', editData.idiomas.filter((_, i) => i !== index));
  };

  const currentData = isEditing ? editData : data;
  const currentLabels = currentData.labels || defaultLabels;

  // Mobile Layout - Premium Modal Style
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between py-4 px-4 print:hidden">
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 text-sm h-10">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <span className="text-sm text-muted-foreground font-medium">Currículo ATS</span>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Content Area */}
        <div className="flex-1 px-4 pb-4 flex flex-col gap-5">
          
          {/* Preview Card - Premium Modal Style - optimized for mobile */}
          <div
            className="relative bg-card rounded-2xl border border-border/40 p-3 shadow-lg animate-scale-in"
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
              {/* Scroll Container */}
              <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '55vh' }}>
                <div className="p-5 text-black">
                  {/* Header */}
                  <header className="mb-5">
                    <div className="flex justify-end mb-3">
                      <div className="text-right text-[11px] text-black space-y-0.5">
                        {currentData.telefone && (
                          <p><span className="font-semibold">{currentLabels.telefone}:</span> <span className="text-blue-600">{currentData.telefone}</span></p>
                        )}
                        {currentData.localizacao && (
                          <p><span className="font-semibold">{currentLabels.localizacao}:</span> <span className="text-blue-600">{currentData.localizacao}</span></p>
                        )}
                        {currentData.email && (
                          <p><span className="font-semibold">{currentLabels.email}:</span> <span className="text-blue-600">{currentData.email}</span></p>
                        )}
                        {currentData.linkedin && (
                          <p className="max-w-[200px]"><span className="font-semibold">{currentLabels.linkedin}:</span> <span className="text-blue-600 break-all text-[10px]">{currentData.linkedin}</span></p>
                        )}
                        {(currentData.nacionalidade || currentData.idade) && (
                          <p className="mt-1.5 uppercase font-semibold text-[10px]">
                            {currentData.nacionalidade}{currentData.nacionalidade && currentData.idade ? ", " : ""}{currentData.idade ? `${currentData.idade} ANOS` : ""}.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="border-b-[3px] border-black mb-2" />
                    <h1 className="text-xl font-light tracking-wide text-black uppercase leading-tight">
                      {currentData.nome}
                    </h1>
                  </header>

                  {/* Experiências */}
                  {currentData.experiencias.length > 0 && (
                    <section className="mb-5">
                      <h2 className="text-[13px] font-bold text-black border-b border-gray-300 pb-1 mb-3 uppercase">
                        {currentLabels.experiencias}
                      </h2>
                      <div className="space-y-4">
                        {currentData.experiencias.map((exp, index) => (
                          <div key={index}>
                            <div className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] mb-0.5">
                              <span className="font-bold text-black">{exp.empresa}{exp.localizacao && `, ${exp.localizacao}`}</span>
                              <span className="text-gray-500">—</span>
                              <span className="font-semibold text-gray-700">{exp.cargo}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase mb-1.5">{exp.periodo}</p>
                            {exp.bullets.length > 0 && (
                              <ul className="space-y-1">
                                {exp.bullets.map((bullet, bulletIndex) => (
                                  <li key={bulletIndex} className="text-[10px] text-gray-700 pl-3 relative leading-relaxed">
                                    <span className="absolute left-0 text-gray-400">&gt;</span>
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Educação */}
                  {currentData.educacao.length > 0 && (
                    <section className="mb-5">
                      <h2 className="text-[13px] font-bold text-black border-b border-gray-300 pb-1 mb-3 uppercase">
                        {currentLabels.educacao}
                      </h2>
                      <ul className="space-y-1">
                        {currentData.educacao.map((edu, index) => (
                          <li key={index} className="text-[11px] text-gray-700">
                            {edu.instituicao} - {edu.curso}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Idiomas */}
                  {currentData.idiomas.length > 0 && (
                    <section>
                      <h2 className="text-[13px] font-bold text-black border-b border-gray-300 pb-1 mb-3 uppercase">
                        {currentLabels.idiomas}
                      </h2>
                      <ul className="space-y-1">
                        {currentData.idiomas.map((idioma, index) => (
                          <li key={index} className="text-[11px] text-gray-700 pl-2.5 relative">
                            <span className="absolute left-0 text-gray-400">-</span>
                            {idioma.idioma} - {idioma.nivel}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </div>

              {/* Bottom Fade Gradient - Visual cue for more content */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons - Outside Preview, Clean Layout */}
          <div className="space-y-3 print:hidden animate-fade-in">
            {/* Primary Action */}
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
            
            {/* Secondary Actions - Grid Layout */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={startEditing} 
                className="h-12 gap-2 rounded-xl bg-card border-border/40 hover:bg-card/80"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              {onSave && (
                <Button 
                  variant="outline" 
                  onClick={onSave} 
                  className="h-12 gap-2 rounded-xl bg-card border-border/40 hover:bg-card/80"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Editing Mode Modal Overlay - Simplified for performance */}
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Edit Mode Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <Button variant="ghost" size="sm" onClick={cancelEditing} className="gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <span className="text-sm font-medium">Modo de Edição</span>
              <Button 
                size="sm" 
                onClick={saveEditing} 
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                Aplicar
              </Button>
            </div>

              {/* Edit Hint */}
              <div className="mx-4 mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                <strong>Toque nos textos</strong> para editar diretamente no currículo.
              </div>

              {/* Scrollable Edit View */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-xl p-5 text-black shadow-lg">
                  {/* Editable Header */}
                  <header className="mb-6">
                    <div className="flex justify-end mb-3">
                      <div className="text-right text-xs text-black space-y-1">
                        <div className="flex items-center justify-end gap-1">
                          <EditableText value={currentLabels.telefone} onChange={(v) => updateLabel('telefone', v)} isEditing={isEditing} className="font-semibold" />
                          <span>:</span>
                          <Input value={editData.telefone} onChange={(e) => updateField('telefone', e.target.value)} className="bg-yellow-50 border-yellow-300 text-blue-600 h-7 py-0.5 px-1 w-32 text-xs" placeholder="(00) 00000-0000" />
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <EditableText value={currentLabels.localizacao} onChange={(v) => updateLabel('localizacao', v)} isEditing={isEditing} className="font-semibold" />
                          <span>:</span>
                          <Input value={editData.localizacao} onChange={(e) => updateField('localizacao', e.target.value)} className="bg-yellow-50 border-yellow-300 text-blue-600 h-7 py-0.5 px-1 w-32 text-xs" placeholder="Cidade, UF" />
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <EditableText value={currentLabels.email} onChange={(v) => updateLabel('email', v)} isEditing={isEditing} className="font-semibold" />
                          <span>:</span>
                          <Input value={editData.email} onChange={(e) => updateField('email', e.target.value)} className="bg-yellow-50 border-yellow-300 text-blue-600 h-7 py-0.5 px-1 w-40 text-xs" placeholder="email@exemplo.com" />
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <EditableText value={currentLabels.linkedin} onChange={(v) => updateLabel('linkedin', v)} isEditing={isEditing} className="font-semibold" />
                          <span>:</span>
                          <Input value={editData.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} className="bg-yellow-50 border-yellow-300 text-blue-600 h-7 py-0.5 px-1 w-44 text-xs" placeholder="linkedin.com/in/..." />
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-2">
                          <Input value={editData.nacionalidade} onChange={(e) => updateField('nacionalidade', e.target.value)} className="bg-yellow-50 border-yellow-300 text-black h-7 py-0.5 px-1 w-24 text-xs uppercase" placeholder="Nacionalidade" />
                          <span>,</span>
                          <Input value={editData.idade} onChange={(e) => updateField('idade', e.target.value)} className="bg-yellow-50 border-yellow-300 text-black h-7 py-0.5 px-1 w-12 text-xs" placeholder="00" />
                          <span className="text-xs">ANOS.</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-b-[3px] border-black mb-2" />
                    <Input value={editData.nome} onChange={(e) => updateField('nome', e.target.value)} className="text-xl font-light tracking-wide text-black uppercase bg-yellow-50 border-yellow-300 h-auto py-1" placeholder="SEU NOME" />
                  </header>

                  {/* Editable Experiences */}
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-black border-b border-gray-300 pb-1 mb-3 uppercase flex items-center gap-2">
                      <EditableText value={currentLabels.experiencias} onChange={(v) => updateLabel('experiencias', v)} isEditing={isEditing} />
                      <Button variant="ghost" size="sm" onClick={addExperiencia} className="h-6 w-6 p-0 text-green-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </h2>
                    <div className="space-y-4">
                      {editData.experiencias.map((exp, index) => (
                        <div key={index} className="relative border border-dashed border-gray-300 p-3 rounded-lg">
                          <Button variant="ghost" size="sm" onClick={() => removeExperiencia(index)} className="absolute -top-2 -right-2 h-6 w-6 p-0 text-red-500 bg-white rounded-full shadow">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <div className="space-y-2">
                            <Input value={exp.empresa} onChange={(e) => updateExperiencia(index, 'empresa', e.target.value)} className="bg-yellow-50 border-yellow-300 text-black font-bold h-8 text-sm" placeholder="Empresa" />
                            <Input value={exp.localizacao} onChange={(e) => updateExperiencia(index, 'localizacao', e.target.value)} className="bg-yellow-50 border-yellow-300 text-black h-8 text-sm" placeholder="Localização" />
                            <Input value={exp.cargo} onChange={(e) => updateExperiencia(index, 'cargo', e.target.value)} className="bg-yellow-50 border-yellow-300 text-gray-800 font-semibold h-8 text-sm" placeholder="Cargo" />
                            <Input value={exp.periodo} onChange={(e) => updateExperiencia(index, 'periodo', e.target.value)} className="bg-yellow-50 border-yellow-300 text-gray-600 text-xs uppercase h-7" placeholder="Jan 2020 - Presente" />
                            <div className="space-y-2 mt-2">
                              {exp.bullets.map((bullet, bulletIndex) => (
                                <div key={bulletIndex} className="flex items-start gap-1">
                                  <Textarea value={bullet} onChange={(e) => updateBullet(index, bulletIndex, e.target.value)} className="bg-yellow-50 border-yellow-300 text-gray-700 text-xs min-h-[40px] flex-1" placeholder="Conquista ou responsabilidade..." />
                                  <Button variant="ghost" size="sm" onClick={() => removeBullet(index, bulletIndex)} className="h-6 w-6 p-0 text-red-500">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" onClick={() => addBullet(index)} className="h-6 text-xs text-green-600 gap-1">
                                <Plus className="w-3 h-3" />
                                Adicionar bullet
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Editable Education */}
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-black border-b border-gray-300 pb-1 mb-3 uppercase flex items-center gap-2">
                      <EditableText value={currentLabels.educacao} onChange={(v) => updateLabel('educacao', v)} isEditing={isEditing} />
                      <Button variant="ghost" size="sm" onClick={addEducacao} className="h-6 w-6 p-0 text-green-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </h2>
                    <div className="space-y-2">
                      {editData.educacao.map((edu, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={edu.instituicao} onChange={(e) => updateEducacao(index, 'instituicao', e.target.value)} className="bg-yellow-50 border-yellow-300 text-gray-700 h-8 text-xs flex-1" placeholder="Instituição" />
                          <span className="text-gray-500">-</span>
                          <Input value={edu.curso} onChange={(e) => updateEducacao(index, 'curso', e.target.value)} className="bg-yellow-50 border-yellow-300 text-gray-700 h-8 text-xs flex-1" placeholder="Curso" />
                          <Button variant="ghost" size="sm" onClick={() => removeEducacao(index)} className="h-6 w-6 p-0 text-red-500">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Editable Languages */}
                  <section>
                    <h2 className="text-sm font-bold text-black border-b border-gray-300 pb-1 mb-3 uppercase flex items-center gap-2">
                      <EditableText value={currentLabels.idiomas} onChange={(v) => updateLabel('idiomas', v)} isEditing={isEditing} />
                      <Button variant="ghost" size="sm" onClick={addIdioma} className="h-6 w-6 p-0 text-green-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </h2>
                    <div className="space-y-2">
                      {editData.idiomas.map((idioma, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={idioma.idioma} onChange={(e) => updateIdioma(index, 'idioma', e.target.value)} className="bg-yellow-50 border-yellow-300 text-gray-700 h-8 text-xs w-28" placeholder="Idioma" />
                          <span className="text-gray-500">-</span>
                          <Input value={idioma.nivel} onChange={(e) => updateIdioma(index, 'nivel', e.target.value)} className="bg-yellow-50 border-yellow-300 text-gray-700 h-8 text-xs w-28" placeholder="Nível" />
                          <Button variant="ghost" size="sm" onClick={() => removeIdioma(index)} className="h-6 w-6 p-0 text-red-500">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

  // Desktop Layout - Original
  return (
    <div className="space-y-4">
      {/* Action Buttons - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button variant="default" size="sm" onClick={saveEditing} className="gap-2 bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4" />
                Aplicar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing} className="gap-2">
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              {onSave && (
                <Button variant="outline" size="sm" onClick={onSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              )}
              <Button variant="glow" size="sm" onClick={handleExportPdf} disabled={isExporting} className="gap-2">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExporting ? "Exportando..." : "Exportar PDF"}
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 print:hidden">
          <strong>Modo de edição ativo:</strong> Clique nos textos para editar. Você pode personalizar os rótulos dos campos (Telefone, Localização, etc.) clicando neles.
        </div>
      )}

      {/* CV Preview */}
      <motion.div
        ref={cvRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white text-black rounded-lg shadow-xl p-8 md:p-12 print:shadow-none print:p-0"
      >
        {/* Header */}
        <header className="mb-8">
          {/* Contact info aligned right */}
          <div className="flex justify-end mb-4">
            <div className="text-right text-sm text-black space-y-0.5">
              {(currentData.telefone || isEditing) && (
                <p className="flex items-center justify-end gap-1">
                  <EditableText
                    value={currentLabels.telefone}
                    onChange={(v) => updateLabel('telefone', v)}
                    isEditing={isEditing}
                    className="font-semibold"
                  />
                  <span>:</span>{" "}
                  {isEditing ? (
                    <Input
                      value={editData.telefone}
                      onChange={(e) => updateField('telefone', e.target.value)}
                      className="bg-yellow-50 border-yellow-300 text-blue-600 h-auto py-0.5 px-1 w-32 inline-block"
                      placeholder="(00) 00000-0000"
                    />
                  ) : (
                    <a href={`tel:${currentData.telefone}`} className="text-blue-600 hover:underline">
                      {currentData.telefone}
                    </a>
                  )}
                </p>
              )}
              {(currentData.localizacao || isEditing) && (
                <p className="flex items-center justify-end gap-1">
                  <EditableText
                    value={currentLabels.localizacao}
                    onChange={(v) => updateLabel('localizacao', v)}
                    isEditing={isEditing}
                    className="font-semibold"
                  />
                  <span>:</span>{" "}
                  {isEditing ? (
                    <Input
                      value={editData.localizacao}
                      onChange={(e) => updateField('localizacao', e.target.value)}
                      className="bg-yellow-50 border-yellow-300 text-blue-600 h-auto py-0.5 px-1 w-40 inline-block"
                      placeholder="Cidade, Estado"
                    />
                  ) : (
                    <span className="text-blue-600">{currentData.localizacao}</span>
                  )}
                </p>
              )}
              {(currentData.email || isEditing) && (
                <p className="flex items-center justify-end gap-1">
                  <EditableText
                    value={currentLabels.email}
                    onChange={(v) => updateLabel('email', v)}
                    isEditing={isEditing}
                    className="font-semibold"
                  />
                  <span>:</span>{" "}
                  {isEditing ? (
                    <Input
                      value={editData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="bg-yellow-50 border-yellow-300 text-blue-600 h-auto py-0.5 px-1 w-48 inline-block"
                      placeholder="email@exemplo.com"
                    />
                  ) : (
                    <a href={`mailto:${currentData.email}`} className="text-blue-600 hover:underline">
                      {currentData.email}
                    </a>
                  )}
                </p>
              )}
              {(currentData.linkedin || isEditing) && (
                <div className="flex items-start justify-end gap-1">
                  <EditableText
                    value={currentLabels.linkedin}
                    onChange={(v) => updateLabel('linkedin', v)}
                    isEditing={isEditing}
                    className="font-semibold"
                  />
                  <span>:</span>
                  <div>
                    {isEditing ? (
                      <Input
                        value={editData.linkedin}
                        onChange={(e) => updateField('linkedin', e.target.value)}
                        className="bg-yellow-50 border-yellow-300 text-blue-600 h-auto py-0.5 px-1 w-56 inline-block"
                        placeholder="linkedin.com/in/seu-perfil"
                      />
                    ) : (
                      <a href={currentData.linkedin} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        {currentData.linkedin}
                      </a>
                    )}
                  </div>
                </div>
              )}
              {(currentData.nacionalidade || currentData.idade || isEditing) && (
                <p className="mt-2 uppercase font-semibold flex items-center justify-end gap-1">
                  {isEditing ? (
                    <>
                      <Input
                        value={editData.nacionalidade}
                        onChange={(e) => updateField('nacionalidade', e.target.value)}
                        className="bg-yellow-50 border-yellow-300 text-black h-auto py-0.5 px-1 w-24 inline-block uppercase"
                        placeholder="Nacionalidade"
                      />
                      <span>,</span>
                      <Input
                        value={editData.idade}
                        onChange={(e) => updateField('idade', e.target.value)}
                        className="bg-yellow-50 border-yellow-300 text-black h-auto py-0.5 px-1 w-12 inline-block"
                        placeholder="00"
                      />
                      <span>ANOS.</span>
                    </>
                  ) : (
                    <>
                      {currentData.nacionalidade}{currentData.nacionalidade && currentData.idade ? ", " : ""}{currentData.idade ? `${currentData.idade} ANOS` : ""}.
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Black bar and name below */}
          <div className="border-b-4 border-black mb-2" />
          {isEditing ? (
            <Input
              value={editData.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              className="text-3xl font-light tracking-wide text-black uppercase bg-yellow-50 border-yellow-300 h-auto py-1"
              placeholder="SEU NOME"
            />
          ) : (
            <h1 className="text-3xl font-light tracking-wide text-black uppercase">
              {currentData.nome}
            </h1>
          )}
        </header>

        {/* Experiências */}
        {(currentData.experiencias.length > 0 || isEditing) && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-black border-b border-gray-300 pb-1 mb-4 uppercase flex items-center gap-2">
              <EditableText
                value={currentLabels.experiencias}
                onChange={(v) => updateLabel('experiencias', v)}
                isEditing={isEditing}
              />
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addExperiencia}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </h2>

            <div className="space-y-6">
              {currentData.experiencias.map((exp, index) => (
                <div key={index} className={isEditing ? "relative border border-dashed border-gray-300 p-3 rounded-lg" : ""}>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperiencia(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 bg-white rounded-full shadow"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                    {isEditing ? (
                      <>
                        <Input
                          value={editData.experiencias[index].empresa}
                          onChange={(e) => updateExperiencia(index, 'empresa', e.target.value)}
                          className="bg-yellow-50 border-yellow-300 text-black font-bold h-auto py-0.5 px-1 w-40"
                          placeholder="Empresa"
                        />
                        <span>,</span>
                        <Input
                          value={editData.experiencias[index].localizacao}
                          onChange={(e) => updateExperiencia(index, 'localizacao', e.target.value)}
                          className="bg-yellow-50 border-yellow-300 text-black h-auto py-0.5 px-1 w-32"
                          placeholder="Localização"
                        />
                        <span className="text-gray-700">—</span>
                        <Input
                          value={editData.experiencias[index].cargo}
                          onChange={(e) => updateExperiencia(index, 'cargo', e.target.value)}
                          className="bg-yellow-50 border-yellow-300 text-gray-800 font-semibold h-auto py-0.5 px-1 w-40"
                          placeholder="Cargo"
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="font-bold text-black">
                          {exp.empresa}{exp.localizacao && `, ${exp.localizacao}`}
                        </h3>
                        <span className="text-gray-700">—</span>
                        <span className="font-semibold text-gray-800">{exp.cargo}</span>
                      </>
                    )}
                  </div>
                  {isEditing ? (
                    <Input
                      value={editData.experiencias[index].periodo}
                      onChange={(e) => updateExperiencia(index, 'periodo', e.target.value)}
                      className="bg-yellow-50 border-yellow-300 text-gray-600 text-sm uppercase h-auto py-0.5 px-1 w-48 mb-2"
                      placeholder="Jan 2020 - Presente"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 uppercase mb-2">{exp.periodo}</p>
                  )}

                  {(exp.bullets.length > 0 || isEditing) && (
                    <ul className="space-y-1">
                      {(isEditing ? editData.experiencias[index].bullets : exp.bullets).map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="text-sm text-gray-700 pl-4 relative flex items-start gap-1">
                          <span className="absolute left-0">&gt;</span>
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-1">
                              <Textarea
                                value={bullet}
                                onChange={(e) => updateBullet(index, bulletIndex, e.target.value)}
                                className="bg-yellow-50 border-yellow-300 text-gray-700 text-sm min-h-[32px] py-1 px-1 flex-1"
                                placeholder="Descreva uma conquista ou responsabilidade..."
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBullet(index, bulletIndex)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            bullet
                          )}
                        </li>
                      ))}
                      {isEditing && (
                        <li className="pl-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addBullet(index)}
                            className="h-6 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar bullet
                          </Button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Educação */}
        {(currentData.educacao.length > 0 || isEditing) && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-black border-b border-gray-300 pb-1 mb-4 uppercase flex items-center gap-2">
              <EditableText
                value={currentLabels.educacao}
                onChange={(v) => updateLabel('educacao', v)}
                isEditing={isEditing}
              />
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addEducacao}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </h2>

            <ul className="space-y-1">
              {currentData.educacao.map((edu, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        value={editData.educacao[index].instituicao}
                        onChange={(e) => updateEducacao(index, 'instituicao', e.target.value)}
                        className="bg-yellow-50 border-yellow-300 text-gray-700 h-auto py-0.5 px-1 w-48"
                        placeholder="Instituição"
                      />
                      <span>-</span>
                      <Input
                        value={editData.educacao[index].curso}
                        onChange={(e) => updateEducacao(index, 'curso', e.target.value)}
                        className="bg-yellow-50 border-yellow-300 text-gray-700 h-auto py-0.5 px-1 flex-1"
                        placeholder="Curso"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducacao(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    `${edu.instituicao}, - ${edu.curso}`
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Idiomas */}
        {(currentData.idiomas.length > 0 || isEditing) && (
          <section>
            <h2 className="text-lg font-bold text-black border-b border-gray-300 pb-1 mb-4 uppercase flex items-center gap-2">
              <EditableText
                value={currentLabels.idiomas}
                onChange={(v) => updateLabel('idiomas', v)}
                isEditing={isEditing}
              />
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addIdioma}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </h2>

            <ul className="space-y-1">
              {currentData.idiomas.map((idioma, index) => (
                <li key={index} className="text-sm text-gray-700 pl-4 relative flex items-center gap-2">
                  <span className="absolute left-0">-</span>
                  {isEditing ? (
                    <>
                      <Input
                        value={editData.idiomas[index].idioma}
                        onChange={(e) => updateIdioma(index, 'idioma', e.target.value)}
                        className="bg-yellow-50 border-yellow-300 text-gray-700 h-auto py-0.5 px-1 w-32"
                        placeholder="Idioma"
                      />
                      <span>-</span>
                      <Input
                        value={editData.idiomas[index].nivel}
                        onChange={(e) => updateIdioma(index, 'nivel', e.target.value)}
                        className="bg-yellow-50 border-yellow-300 text-gray-700 h-auto py-0.5 px-1 w-32"
                        placeholder="Nível"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIdioma(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    `${idioma.idioma} - ${idioma.nivel}`
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </motion.div>
    </div>
  );
}