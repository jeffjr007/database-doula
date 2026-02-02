import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check, MessageSquare, Briefcase, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

type TrainingStep = 'intro' | 'about' | 'experiences' | 'done';

export const InterviewTraining = ({
  companyName,
  aboutMeScript,
  careerIntro,
  experienceScripts,
  onComplete,
}: InterviewTrainingProps) => {
  const [step, setStep] = useState<TrainingStep>('intro');

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

            {/* Experience Scripts */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Depois, conecte suas experiências com as palavras-chave da vaga:
              </h4>
              
              {experienceScripts.map((script, index) => (
                <Card key={script.keyword} className="p-4 bg-secondary/20">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {script.keyword}
                      </span>
                      {script.company && (
                        <span className="text-xs text-muted-foreground">
                          • {script.role} — {script.company}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {script.script}
                    </p>
                  </div>
                </Card>
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
              <Button onClick={onComplete} className="gap-2">
                <Check className="w-4 h-4" />
                Finalizar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
