import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

interface FreelancerOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface PortfolioItem {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}

interface OnboardingData {
  // Basic Info
  full_name: string;
  phone: string;
  bio: string;

  // Professional
  job_title: string;
  category: string;
  skills: string;
  experience: string;
  education: string;
  languages: string;
  website: string;

  // Portfolio
  portfolio: PortfolioItem[];

  // Rates & Availability
  hourly_rate: string;
  availability: string;
  start_date: string;
}

export function FreelancerOnboarding({
  open,
  onOpenChange,
  onComplete,
}: FreelancerOnboardingProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = getTranslation(language as any).onboarding;
  const categories = getTranslation(language as any).categories.items;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    full_name: user?.user_metadata?.full_name || "",
    phone: "",
    bio: "",
    job_title: "",
    category: "",
    skills: "",
    experience: "",
    education: "",
    languages: "",
    website: "",
    portfolio: [],
    hourly_rate: "",
    availability: "",
    start_date: "",
  });

  const steps = [
    {
      title: t.steps.basic,
      icon: User,
      component: BasicInfoStep,
    },
    {
      title: t.steps.professional,
      icon: Briefcase,
      component: ProfessionalStep,
    },
    {
      title: t.steps.portfolio,
      icon: FolderOpen,
      component: PortfolioStep,
    },
    {
      title: t.steps.rates,
      icon: DollarSign,
      component: RatesStep,
    },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        if (!data.full_name.trim() || !data.phone.trim() || !data.bio.trim()) {
          toast.error(t.messages.validationError);
          return false;
        }
        return true;
      case 1: // Professional
        if (
          !data.job_title.trim() ||
          !data.category.trim() ||
          !data.skills.trim() ||
          !data.experience.trim()
        ) {
          toast.error(t.messages.validationError);
          return false;
        }
        return true;
      case 2: // Portfolio
        if (data.portfolio.length === 0) {
          toast.error(
            language === "en"
              ? "Please add at least one portfolio project"
              : "請至少添加一個作品集項目"
          );
          return false;
        }
        return true;
      case 3: // Rates
        if (
          !data.hourly_rate.trim() ||
          !data.availability.trim() ||
          !data.start_date.trim()
        ) {
          toast.error(t.messages.validationError);
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error(language === "en" ? "Please login first" : "請先登入");
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    setSubmitting(true);
    try {
      // Update profile data
      const profileData = {
        user_id: user.id,
        email: user.email,
        full_name: data.full_name,
        phone: data.phone,
        bio: data.bio,
        job_title: data.job_title,
        company: "", // Freelancers typically don't have a company
        skills: data.skills,
        website: data.website,
        account_type: "freelancer" as const,
        // Additional freelancer-specific fields (stored as JSON in a text field or separate columns)
        experience_years: data.experience,
        education: data.education,
        languages: data.languages,
        hourly_rate: data.hourly_rate,
        availability: data.availability,
        start_date: data.start_date,
        portfolio: JSON.stringify(data.portfolio),
        updated_at: new Date().toISOString(),
      };

      // Upsert profile
      const { error } = await supabase.from("profiles").upsert(profileData);

      if (error) {
        console.error("Profile upsert error:", error);
        throw error;
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          account_type: "freelancer",
        },
      });

      toast.success(t.messages.success);
      onOpenChange(false);
      onComplete();

      // Reload the page to show updated profile
      window.location.reload();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(`${t.messages.error}: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <p
                    className={`text-xs text-center ${
                      isActive
                        ? "text-blue-600 font-semibold"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 -mt-8 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1">
          <CurrentStepComponent
            data={data}
            setData={setData}
            language={language}
            t={t}
            categories={categories}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => onOpenChange(false) : handlePrevious}
            disabled={submitting}
          >
            {currentStep === 0 ? (
              t.buttons.cancel
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t.buttons.previous}
              </>
            )}
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              {t.buttons.next}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.buttons.submitting}
                </>
              ) : (
                t.buttons.submit
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step Components
interface StepProps {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  language: "en" | "zh";
  t: any;
  categories: any[];
}

function BasicInfoStep({ data, setData, language, t }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">{t.basic.title}</h3>
        <p className="text-sm text-gray-600">{t.basic.description}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">
            {t.basic.fields.fullName} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_name"
            value={data.full_name}
            onChange={(e) => setData({ ...data, full_name: e.target.value })}
            placeholder={language === "en" ? "John Doe" : "張三"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            {t.basic.fields.phone} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            placeholder={language === "en" ? "+1 (555) 123-4567" : "+886 912 345 678"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">
            {t.basic.fields.bio} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            placeholder={t.basic.fields.bioPlaceholder}
            rows={6}
          />
          <p className="text-xs text-gray-500">
            {language === "en"
              ? "This will be displayed on your public profile. Make it compelling!"
              : "這將顯示在您的公開個人資料上。讓它吸引人！"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfessionalStep({ data, setData, language, t, categories }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">{t.professional.title}</h3>
        <p className="text-sm text-gray-600">{t.professional.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="job_title">
            {t.professional.fields.jobTitle} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="job_title"
            value={data.job_title}
            onChange={(e) => setData({ ...data, job_title: e.target.value })}
            placeholder={t.professional.fields.jobTitlePlaceholder}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category">
            {t.professional.fields.category} <span className="text-red-500">*</span>
          </Label>
          <Select value={data.category} onValueChange={(value) => setData({ ...data, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t.professional.fields.categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category, index) => (
                <SelectItem key={index} value={category.title}>
                  {category.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="skills">
            {t.professional.fields.skills} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="skills"
            value={data.skills}
            onChange={(e) => setData({ ...data, skills: e.target.value })}
            placeholder={t.professional.fields.skillsPlaceholder}
          />
          <p className="text-xs text-gray-500">{t.professional.fields.skillsHint}</p>
        </div>

        {data.skills && (
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              {data.skills.split(",").map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="experience">
            {t.professional.fields.experience} <span className="text-red-500">*</span>
          </Label>
          <Select value={data.experience} onValueChange={(value) => setData({ ...data, experience: value })}>
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "Select years" : "選擇年數"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">{language === "en" ? "Less than 1 year" : "少於1年"}</SelectItem>
              <SelectItem value="1-3">{language === "en" ? "1-3 years" : "1-3年"}</SelectItem>
              <SelectItem value="3-5">{language === "en" ? "3-5 years" : "3-5年"}</SelectItem>
              <SelectItem value="5-10">{language === "en" ? "5-10 years" : "5-10年"}</SelectItem>
              <SelectItem value="10+">{language === "en" ? "10+ years" : "10年以上"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="languages">
            {t.professional.fields.languages}
          </Label>
          <Input
            id="languages"
            value={data.languages}
            onChange={(e) => setData({ ...data, languages: e.target.value })}
            placeholder={t.professional.fields.languagesPlaceholder}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="education">{t.professional.fields.education}</Label>
          <Input
            id="education"
            value={data.education}
            onChange={(e) => setData({ ...data, education: e.target.value })}
            placeholder={t.professional.fields.educationPlaceholder}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="website">{t.professional.fields.website}</Label>
          <Input
            id="website"
            type="url"
            value={data.website}
            onChange={(e) => setData({ ...data, website: e.target.value })}
            placeholder={t.professional.fields.websitePlaceholder}
          />
        </div>
      </div>
    </div>
  );
}

function PortfolioStep({ data, setData, language, t }: StepProps) {
  const [newProject, setNewProject] = useState<PortfolioItem>({
    title: "",
    description: "",
    url: "",
    imageUrl: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const addProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim()) {
      toast.error(
        language === "en" ? "Please fill in project details" : "請填寫項目詳情"
      );
      return;
    }

    setData({
      ...data,
      portfolio: [...data.portfolio, newProject],
    });

    setNewProject({ title: "", description: "", url: "", imageUrl: "" });
    setShowAddForm(false);
  };

  const removeProject = (index: number) => {
    setData({
      ...data,
      portfolio: data.portfolio.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">{t.portfolio.title}</h3>
        <p className="text-sm text-gray-600">{t.portfolio.description}</p>
      </div>

      {/* Existing Projects */}
      {data.portfolio.length > 0 && (
        <div className="space-y-3">
          {data.portfolio.map((project, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{project.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {project.url}
                    </a>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProject(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Project Form */}
      {showAddForm ? (
        <Card className="p-4 border-2 border-blue-200">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t.portfolio.projectTitle} *</Label>
              <Input
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder={language === "en" ? "E-commerce Website" : "電子商務網站"}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.portfolio.projectDescription} *</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder={
                  language === "en"
                    ? "Built a full-featured e-commerce platform with React and Node.js..."
                    : "使用 React 和 Node.js 建立功能完整的電子商務平台..."
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.portfolio.projectUrl}</Label>
              <Input
                type="url"
                value={newProject.url}
                onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={addProject} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Check className="h-4 w-4 mr-2" />
                {language === "en" ? "Add" : "添加"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewProject({ title: "", description: "", url: "", imageUrl: "" });
                }}
              >
                {language === "en" ? "Cancel" : "取消"}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full border-dashed border-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.portfolio.addProject}
        </Button>
      )}

      {data.portfolio.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-500 text-center py-4">{t.portfolio.noProjects}</p>
      )}
    </div>
  );
}

function RatesStep({ data, setData, language, t }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">{t.rates.title}</h3>
        <p className="text-sm text-gray-600">{t.rates.description}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hourly_rate">
            {t.rates.fields.hourlyRate} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="hourly_rate"
              type="number"
              min="1"
              value={data.hourly_rate}
              onChange={(e) => setData({ ...data, hourly_rate: e.target.value })}
              placeholder={t.rates.fields.hourlyRatePlaceholder}
              className="pl-8"
            />
          </div>
          <p className="text-xs text-gray-500">
            {language === "en"
              ? "This is your standard hourly rate. You can negotiate project-based pricing with clients."
              : "這是您的標準時薪。您可以與客戶協商基於項目的定價。"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">
            {t.rates.fields.availability} <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.availability}
            onValueChange={(value) => setData({ ...data, availability: value })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={language === "en" ? "Select availability" : "選擇可用性"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fullTime">
                {t.rates.fields.availabilityOptions.fullTime}
              </SelectItem>
              <SelectItem value="partTime">
                {t.rates.fields.availabilityOptions.partTime}
              </SelectItem>
              <SelectItem value="asNeeded">
                {t.rates.fields.availabilityOptions.asNeeded}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">
            {t.rates.fields.startDate} <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.start_date}
            onValueChange={(value) => setData({ ...data, start_date: value })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={language === "en" ? "Select start date" : "選擇開始日期"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">
                {t.rates.fields.startDateOptions.immediately}
              </SelectItem>
              <SelectItem value="withinWeek">
                {t.rates.fields.startDateOptions.withinWeek}
              </SelectItem>
              <SelectItem value="withinMonth">
                {t.rates.fields.startDateOptions.withinMonth}
              </SelectItem>
              <SelectItem value="flexible">
                {t.rates.fields.startDateOptions.flexible}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold mb-3 text-blue-900">
            {language === "en" ? "Profile Summary" : "個人資料摘要"}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === "en" ? "Hourly Rate:" : "時薪："}
              </span>
              <span className="font-semibold">
                {data.hourly_rate ? `$${data.hourly_rate}/hr` : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === "en" ? "Availability:" : "可用性："}
              </span>
              <span className="font-semibold">
                {data.availability
                  ? t.rates.fields.availabilityOptions[
                      data.availability as keyof typeof t.rates.fields.availabilityOptions
                    ]
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {language === "en" ? "Can Start:" : "可開始："}
              </span>
              <span className="font-semibold">
                {data.start_date
                  ? t.rates.fields.startDateOptions[
                      data.start_date as keyof typeof t.rates.fields.startDateOptions
                    ]
                  : "-"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}