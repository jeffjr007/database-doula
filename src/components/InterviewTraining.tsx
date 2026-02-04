import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check, MessageSquare, Briefcase, Sparkles, Target, Brain, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface KeywordScript {
  keyword: string;
  experience: string;
  company: string;
  role: string;
  script: string;
}

interface InterviewTrainingProps {
  companyName: string;
  aboutMeScript: string;
  careerIntro?: string | null;
  experienceScripts: KeywordScript[];
  onComplete: () => void;
}

type TrainingStep = 'intro' | 'about' | 'experiences' | 'closing';

const CLOSING_QUESTION_1 = `Gostei dessa conversa, foi bom poder ouvir os desafios da vaga e falar das minhas experiências. Gostei bastante e queria saber a sua opinião, o que você achou dessa conversa?`;

const CLOSING_QUESTION_2 = `Baseado no que você estudou do meu currículo e perfil, em tudo que pude compartilhar sobre a minha trajetória, e considerando os desafios da vaga, como você acredita que eu consiga contribuir para ajudar nessa posição?`;

export const InterviewTraining = ({
  companyName,
  aboutMeScript,
  careerIntro,
  experienceScripts,
  onComplete,
}: InterviewTrainingProps) => {
  const [step, setStep] = useState<TrainingStep>('intro');
  const isMobile = useIsMobile();

  // Group scripts by company + role combination
  const scriptsByExperience = experienceScripts.reduce((acc, script) => {
    const key = `${script.company}||${script.role}`;
    if (!acc[key]) {
      acc[key] = { company: script.company, role: script.role, scripts: [] };
    }
    acc[key].scripts.push(script);
    return acc;
  }, {} as Record<string, { company: string; role: string; scripts: KeywordScript[] }>);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 py-12"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold">
                Agora você está preparado para a entrevista com a {companyName}!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Vamos revisar seus materiais de preparação para as perguntas mais importantes.
              </p>
            </div>
            <Button onClick={() => setStep('about')} className="gap-2">
              Começar Revisão
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {step === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold">Pergunta 1</h2>
              <p className="text-2xl font-semibold text-primary">"Me fale sobre você"</p>
            </div>

            <Card className="p-6 bg-secondary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  Seu roteiro preparado:
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {aboutMeScript}
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Dica para responder
                </h4>
                <p className="text-sm text-muted-foreground">
                  Fale de forma natural, como se estivesse conversando. Não decore palavra por palavra — 
                  use o roteiro como guia para os pontos principais que você quer abordar.
                </p>
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep('experiences')} className="gap-2">
                Próxima Pergunta
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'experiences' && (
          <motion.div
            key="experiences"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold">Pergunta 2</h2>
              <p className="text-2xl font-semibold text-primary">"Me fale sobre suas experiências"</p>
            </div>

            {/* Career Introduction */}
            {careerIntro && (
              <Card className="p-5 bg-gradient-to-br from-primary/10 to-secondary/30 border-primary/20">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Comece assim:
                  </h4>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {careerIntro}
                  </p>
                </div>
              </Card>
            )}

            {/* Grouped Scripts by Company */}
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Depois, conecte suas experiências com as palavras-chave da vaga:
              </p>

              {Object.entries(scriptsByExperience).map(([key, { company, role, scripts }]) => (
                <div key={key} className="space-y-3">
                  {/* Company Header */}
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {company} — {role}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {scripts.length} {scripts.length === 1 ? 'roteiro' : 'roteiros'}
                      </p>
                    </div>
                  </div>

                  {/* Scripts for this experience */}
                  <div className="space-y-3">
                    {scripts.map((script) => (
                      <Card key={script.keyword} className="p-4 bg-secondary/20">
                        <div className="space-y-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 inline-block">
                            {script.keyword}
                          </span>
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {script.script}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Dica para responder
                </h4>
                <p className="text-sm text-muted-foreground">
                  Escolha 2-3 experiências mais relevantes para a vaga. Use a estrutura: 
                  <strong> O que fez → Como fez → Resultado</strong>. Seja específico com números quando possível.
                </p>
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep('closing')} className="gap-2">
                Próximo: Perguntas de Fechamento
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'closing' && (
          <motion.div
            key="closing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Target className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold">
                Pergunta 3: Fechar a Entrevista
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                Duas perguntas estratégicas que transformam você de candidato comum em candidato memorável
              </p>
            </div>

            {/* Introduction Card */}
            <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/5 via-transparent to-secondary/20 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Por que isso funciona?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A maioria dos candidatos termina a entrevista com um simples "obrigado". 
                    Você vai sair de forma estratégica, fazendo o recrutador <strong>verbalizar</strong> pontos positivos sobre você.
                  </p>
                </div>
              </div>
            </Card>

            {/* Question Cards */}
            <div className="grid gap-4 md:gap-6">
              {/* Question 1 */}
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      1
                    </div>
                    <div>
                      <span className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                        Pergunta Estratégica
                      </span>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Pedindo Feedback
                      </h3>
                    </div>
                  </div>
                  
                  <div className="relative bg-background/80 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-border/50">
                    <Quote className="absolute -top-2 -left-2 w-6 h-6 text-blue-500/30" />
                    <p className="text-foreground leading-relaxed text-sm md:text-base italic pl-3">
                      "{CLOSING_QUESTION_1}"
                    </p>
                  </div>
                </div>
                
                <div className="p-4 md:p-5 bg-card border-t border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Objetivo dessa pergunta:</span>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Faz o recrutador <strong className="text-foreground">verbalizar</strong> o que ele realmente pensa sobre seu perfil, 
                        suas habilidades e impressões iniciais. Ao falar em voz alta, ele reforça os pontos positivos na própria mente.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Question 2 */}
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      2
                    </div>
                    <div>
                      <span className="text-xs md:text-sm text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">
                        Estratégia de PNL
                      </span>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Projetando Você como Solução
                      </h3>
                    </div>
                  </div>
                  
                  <div className="relative bg-background/80 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-border/50">
                    <Quote className="absolute -top-2 -left-2 w-6 h-6 text-purple-500/30" />
                    <p className="text-foreground leading-relaxed text-sm md:text-base italic pl-3">
                      "{CLOSING_QUESTION_2}"
                    </p>
                  </div>
                </div>
                
                <div className="p-4 md:p-5 bg-card border-t border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Técnica de PNL aplicada:</span>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Essa pergunta leva o recrutador a <strong className="text-foreground">identificar seus pontos fortes</strong> e 
                        <strong className="text-foreground"> projetar você como a solução</strong> para a vaga. 
                        Fortalece sua imagem como candidato estratégico e memorável.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tip Card */}
            <Card className="p-4 md:p-5 bg-secondary/30 border-secondary">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-primary">Dica importante:</span>
                  <p className="text-sm text-muted-foreground">
                    Faça essas perguntas com naturalidade, como se estivesse genuinamente interessado na opinião do recrutador. 
                    O tom deve ser de curiosidade, não de pressão.
                  </p>
                </div>
              </div>
            </Card>

            {/* CTA Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={onComplete} size={isMobile ? "default" : "lg"} className="gap-2 px-8">
                <Check className="w-4 h-4" />
                Finalizar Treinamento
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
