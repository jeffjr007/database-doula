import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Languages,
  Award,
  Lightbulb,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SupportButton } from "@/components/SupportButton";
import { MentorAvatar } from "@/components/MentorAvatar";
import logoAD from "@/assets/logo-ad.png";

interface GupySectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  tips: string[];
  warnings: string[];
  copyTexts?: { label: string; text: string }[];
  checklistItems: { id: string; label: string }[];
}

const GUPY_SECTIONS: GupySectionProps[] = [
  {
    id: "experiencia-academica",
    title: "Experiência Acadêmica",
    icon: GraduationCap,
    tips: [
      "O nome do curso precisa ser simples e direto.",
      "Remova vírgulas, hífens ou textos longos do nome do curso.",
      'Por exemplo: "MBA em Big Data para Negócios" → "Inteligência Artificial"',
      "Clique no nome do curso para editar diretamente na Gupy.",
    ],
    warnings: [
      "Não precisa remover o antigo — só edite o nome para ficar mais curto.",
      "Nomes simplificados ajudam o ATS a encontrar palavras-chave.",
    ],
    checklistItems: [
      { id: "edu-1", label: "Simplifiquei os nomes dos cursos" },
      { id: "edu-2", label: "Removi vírgulas e hífens" },
      { id: "edu-3", label: "Todos os cursos estão com nomes curtos e diretos" },
    ],
  },
  {
    id: "experiencia-profissional",
    title: "Experiência Profissional",
    icon: Briefcase,
    tips: [
      "Copie exatamente o que está no LinkedIn — título, descrição, tudo igual.",
      "A diferença é: nada de caractere especial.",
      "Sem bolinha preta (•), sem sinal de maior (>), sem emojis.",
      'Porcentagem sempre por extenso: "36%" vira "trinta e seis por cento".',
      "Apague tudo que tinha antes e refaça igual ao LinkedIn.",
    ],
    warnings: [
      "Caracteres especiais fazem o ATS não ler seu currículo corretamente.",
      "O texto deve ser limpo, apenas letras e números.",
    ],
    checklistItems: [
      { id: "exp-1", label: "Copiei todas as experiências do LinkedIn" },
      { id: "exp-2", label: "Removi todos os caracteres especiais (•, >, ♦)" },
      { id: "exp-3", label: "Escrevi porcentagens por extenso" },
      { id: "exp-4", label: "Removi emojis se havia algum" },
    ],
  },
  {
    id: "idiomas",
    title: "Idiomas",
    icon: Languages,
    tips: [
      "Adicione todos os idiomas que você domina.",
      "Seja honesto com o nível de cada idioma.",
      "Idiomas são filtros importantes para vagas internacionais.",
    ],
    warnings: [
      "Nunca minta sobre fluência — você pode ser testado na entrevista.",
    ],
    checklistItems: [
      { id: "lang-1", label: "Adicionei todos os idiomas que falo" },
      { id: "lang-2", label: "Coloquei o nível correto de cada um" },
    ],
  },
  {
    id: "conquistas-certificados",
    title: "Conquistas ou Certificados",
    icon: Award,
    tips: [
      "Informe sobre cursos, trabalho voluntário e reconhecimentos.",
      "Use nomes simples e diretos para os cursos.",
      "Certificações importantes como AWS, Google, Microsoft devem estar aqui.",
    ],
    warnings: [
      "Cursos online gratuitos também contam — adicione todos relevantes.",
      "Mantenha os títulos sem caracteres especiais.",
    ],
    checklistItems: [
      { id: "cert-1", label: "Adicionei meus certificados e cursos" },
      { id: "cert-2", label: "Os títulos estão simplificados" },
      { id: "cert-3", label: "Removi caracteres especiais dos títulos" },
    ],
  },
  {
    id: "habilidades",
    title: "Habilidades",
    icon: Lightbulb,
    tips: [
      "Remove todas as habilidades atuais na Gupy.",
      "Adicione as 30 principais competências do seu LinkedIn.",
      "Vá no perfil do LinkedIn → seção 'Competências'.",
      "Copie e cole cada competência uma por uma na Gupy.",
    ],
    warnings: [
      "A Gupy permite até 30 habilidades — use todas!",
      "Quanto mais habilidades relevantes, maior seu score no ATS.",
    ],
    checklistItems: [
      { id: "skill-1", label: "Removi as habilidades antigas da Gupy" },
      { id: "skill-2", label: "Copiei minhas competências do LinkedIn" },
      { id: "skill-3", label: "Adicionei pelo menos 20 habilidades" },
      { id: "skill-4", label: "Tentei chegar nas 30 habilidades" },
    ],
  },
  {
    id: "personalizar-candidatura",
    title: "Personalizar Candidatura",
    icon: FileText,
    tips: [
      "Após se candidatar a uma vaga, aparece 'Personalizar candidatura'.",
      "Ali você vai colar o texto 'Sobre' do LinkedIn que criamos.",
      "Esse texto faz toda diferença para o recrutador!",
    ],
    warnings: [
      "Faça isso para CADA vaga que você se candidatar.",
      "O texto personalizado aumenta muito suas chances.",
    ],
    checklistItems: [
      { id: "custom-1", label: "Sei onde fica o campo 'Personalizar candidatura'" },
      { id: "custom-2", label: "Tenho meu texto 'Sobre' do LinkedIn pronto para colar" },
    ],
  },
];

export const GupyGuide = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<string[]>(["experiencia-academica"]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const toggleCheck = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getSectionProgress = (section: GupySectionProps) => {
    const total = section.checklistItems.length;
    const completed = section.checklistItems.filter(
      (item) => checkedItems[item.id]
    ).length;
    return { completed, total };
  };

  const getTotalProgress = () => {
    const allItems = GUPY_SECTIONS.flatMap((s) => s.checklistItems);
    const completed = allItems.filter((item) => checkedItems[item.id]).length;
    return { completed, total: allItems.length };
  };

  const progress = getTotalProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logoAD} alt="Logo" className="w-8 h-8 rounded-lg" />
            <div>
              <h1 className="text-lg font-semibold">Estratégias Gupy</h1>
              <p className="text-xs text-muted-foreground">
                Etapa 6 • Otimização ATS
              </p>
            </div>
          </div>
          <SupportButton />
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${(progress.completed / progress.total) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {progress.completed}/{progress.total}
            </span>
          </div>
        </div>
      </header>

      {/* Mentor Intro */}
      <div className="px-4 py-6">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MentorAvatar size="md" className="shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Seu mentor</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Agora vamos otimizar seu currículo da Gupy para passar no ATS.
                  Siga cada seção abaixo — ela replica exatamente o layout da
                  Gupy. Complete o checklist de cada seção e você estará pronto!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gupy Layout Sections */}
      <div className="px-4 pb-8 space-y-4">
        {/* Header like Gupy */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Meu currículo</h2>
          <p className="text-sm text-muted-foreground">
            Preencha os blocos com seus dados e mantenha seu currículo
            atualizado para se candidatar às vagas. Caso realize alterações,
            estes ajustes serão{" "}
            <strong>replicados para todas as suas candidaturas ativas.</strong>
          </p>
        </div>

        {/* Sections */}
        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="space-y-3"
        >
          {GUPY_SECTIONS.map((section) => {
            const sectionProgress = getSectionProgress(section);
            const isComplete =
              sectionProgress.completed === sectionProgress.total;

            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border rounded-lg bg-card overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    <section.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{section.title}</span>
                    {isComplete ? (
                      <Badge
                        variant="default"
                        className="bg-green-500/20 text-green-500 border-green-500/30 ml-2"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Concluído
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="ml-2 text-muted-foreground"
                      >
                        {sectionProgress.completed}/{sectionProgress.total}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    {/* Tips */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Info className="w-4 h-4" />
                        <span>Orientações do Mentor</span>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                        {section.tips.map((tip, index) => (
                          <p
                            key={index}
                            className="text-sm text-foreground/80 flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">•</span>
                            {tip}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Warnings */}
                    {section.warnings.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
                          <AlertCircle className="w-4 h-4" />
                          <span>Atenção</span>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-2">
                          {section.warnings.map((warning, index) => (
                            <p
                              key={index}
                              className="text-sm text-foreground/80 flex items-start gap-2"
                            >
                              <span className="text-amber-500 mt-1">!</span>
                              {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        <span>Checklist</span>
                      </div>
                      <div className="space-y-2">
                        {section.checklistItems.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                checkedItems[item.id]
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/30"
                              }`}
                              onClick={() => toggleCheck(item.id)}
                            >
                              {checkedItems[item.id] && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <span
                              className={`text-sm flex-1 ${
                                checkedItems[item.id]
                                  ? "text-muted-foreground line-through"
                                  : ""
                              }`}
                            >
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Copy Buttons */}
                    {section.copyTexts && section.copyTexts.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {section.copyTexts.map((copyItem, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() =>
                              handleCopy(copyItem.text, copyItem.label)
                            }
                          >
                            <Copy className="w-4 h-4" />
                            Copiar {copyItem.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Completion Card */}
        <AnimatePresence>
          {progress.completed === progress.total && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-green-500/10 to-primary/5 border-green-500/30">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-500">
                      Parabéns! 🎉
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Você completou todas as otimizações da Gupy. Seu currículo
                      está pronto para passar no ATS!
                    </p>
                  </div>
                  <Button onClick={() => navigate("/")} className="gap-2">
                    Voltar ao Portal
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GupyGuide;
