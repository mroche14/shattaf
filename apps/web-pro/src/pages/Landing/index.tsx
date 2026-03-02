import React from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets,
  TrendingUp,
  Calendar,
  Shield,
  MapPin,
  CreditCard,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Phone,
  Users,
  Wrench,
  Sparkles,
  Zap,
} from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">
                RESEAU <span className="cyan-gradient-text">PLOMB</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="text-secondary hover:text-primary transition-colors px-3 py-2"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="btn-primary px-5 py-2.5 rounded-xl font-medium"
              >
                Devenir partenaire
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-500 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Rejoignez le réseau #1 en Guadeloupe
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 text-primary leading-tight">
              Développez votre activité de{' '}
              <span className="cyan-gradient-text">
                plombier
              </span>
            </h1>
            <p className="text-xl text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Recevez des missions qualifiées, gérez votre planning et augmentez vos revenus
              avec Réseau Plomb. <span className="font-semibold text-primary">Zéro prospection, 100% installation.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 btn-primary rounded-2xl font-semibold text-lg hover:-translate-y-1 transition-all duration-300"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:+590590000000"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 card rounded-2xl font-semibold text-lg text-primary hover:scale-105 transition-all duration-300"
              >
                <Phone className="w-5 h-5 text-cyan-500" />
                Nous appeler
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
            {[
              { value: '150+', label: 'Plombiers partenaires', icon: Users },
              { value: '2500+', label: 'Installations réalisées', icon: CheckCircle },
              { value: '45min', label: 'Temps moyen intervention', icon: Clock },
              { value: '4.9/5', label: 'Note moyenne', icon: Star },
            ].map((stat, i) => (
              <div
                key={i}
                className="group text-center p-6 card rounded-2xl hover:scale-105 transition-all duration-300"
              >
                <stat.icon className="w-6 h-6 text-cyan-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl sm:text-4xl font-bold cyan-gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-tertiary mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-500 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Avantages
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-primary">
              Pourquoi rejoindre Réseau Plomb ?
            </h2>
            <p className="text-secondary max-w-2xl mx-auto text-lg">
              Une plateforme conçue pour les plombiers professionnels qui veulent
              développer leur activité sereinement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Planning optimisé',
                description:
                  'Recevez des missions proches de vous et organisez votre semaine efficacement.',
                gradient: 'from-cyan-500 to-blue-500',
              },
              {
                icon: CreditCard,
                title: 'Paiement garanti',
                description:
                  'Soyez payé sous 48h après chaque intervention. Zéro impayé, zéro souci.',
                gradient: 'from-emerald-500 to-teal-500',
              },
              {
                icon: MapPin,
                title: 'Missions locales',
                description:
                  'Choisissez votre zone d\'intervention (971, 972, 973) et vos créneaux.',
                gradient: 'from-indigo-500 to-blue-500',
              },
              {
                icon: TrendingUp,
                title: 'Revenus réguliers',
                description:
                  'En moyenne 800€ à 2000€/mois de revenus complémentaires.',
                gradient: 'from-amber-500 to-orange-500',
              },
              {
                icon: Shield,
                title: 'Clients qualifiés',
                description:
                  'Tous les clients ont déjà payé. Pas de devis, pas de négociation.',
                gradient: 'from-blue-500 to-indigo-500',
              },
              {
                icon: Wrench,
                title: 'Matériel fourni',
                description:
                  'Le kit shattaf est livré sur place. Vous n\'avez qu\'à installer.',
                gradient: 'from-rose-500 to-pink-500',
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="group p-8 card rounded-3xl hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">{benefit.title}</h3>
                <p className="text-secondary leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-primary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-primary">
              Comment ça marche ?
            </h2>
            <p className="text-secondary text-lg">
              Devenez partenaire en 3 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Inscription',
                description:
                  'Créez votre profil en 5 minutes. Ajoutez vos certifications et votre zone d\'intervention.',
              },
              {
                step: '2',
                title: 'Validation',
                description:
                  'Notre équipe vérifie vos documents sous 24h. Vous recevez votre badge partenaire.',
              },
              {
                step: '3',
                title: 'Missions',
                description:
                  'Recevez vos premières missions et commencez à générer des revenus immédiatement.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {item.step}
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">{item.title}</h3>
                <p className="text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-24 px-4 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-primary">
                Critères pour devenir partenaire
              </h2>
              <p className="text-secondary mb-10 text-lg leading-relaxed">
                Nous recherchons des plombiers professionnels et motivés pour
                offrir le meilleur service à nos clients.
              </p>
              <ul className="space-y-5">
                {[
                  'Carte professionnelle de plombier valide',
                  'Assurance responsabilité civile professionnelle',
                  'Expérience minimum de 2 ans',
                  'Véhicule utilitaire',
                  'Disponibilité minimum 10h/semaine',
                  'Smartphone pour l\'application',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-primary font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl" />
              <div className="relative card rounded-3xl p-10 border-2 border-cyan-500/30">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 text-primary">
                    Rejoignez 150+ plombiers
                  </h3>
                  <p className="text-secondary mb-8 text-lg">
                    qui font déjà confiance à Réseau Plomb
                  </p>
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-2 w-full px-6 py-4 btn-primary rounded-2xl font-semibold text-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    Postuler maintenant
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <p className="text-sm text-tertiary mt-5">
                    Inscription gratuite • Validation sous 24h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-primary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-primary">
              Ils témoignent
            </h2>
            <p className="text-secondary text-lg">
              Ce que nos partenaires disent de nous
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Jean-Pierre M.',
                location: 'Pointe-à-Pitre (971)',
                quote:
                  'Depuis que je suis partenaire Réseau Plomb, j\'ai des missions régulières sans avoir à prospecter. Le paiement est toujours rapide.',
                rating: 5,
              },
              {
                name: 'Marcel D.',
                location: 'Fort-de-France (972)',
                quote:
                  'L\'application est simple à utiliser. Je choisis mes créneaux et je reçois les missions qui m\'arrangent.',
                rating: 5,
              },
              {
                name: 'Thierry L.',
                location: 'Cayenne (973)',
                quote:
                  'Un complément de revenu idéal. Les clients sont satisfaits et les interventions sont rapides.',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="group p-8 card rounded-3xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-primary mb-6 text-lg leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-primary">{testimonial.name}</div>
                    <div className="text-sm text-tertiary">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-3xl blur-2xl" />
            <div className="relative card rounded-3xl p-10 sm:p-16 text-center border-2 border-cyan-500/30">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-primary">
                Prêt à augmenter vos revenus ?
              </h2>
              <p className="text-secondary mb-10 max-w-xl mx-auto text-lg">
                Inscription gratuite en 5 minutes. Commencez à recevoir des missions
                dès la validation de votre profil.
              </p>
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 px-10 py-5 btn-primary rounded-2xl font-semibold text-xl hover:-translate-y-1 transition-all duration-300"
              >
                Devenir partenaire Réseau Plomb
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-theme bg-primary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-primary text-lg">RESEAU PLOMB</span>
          </div>
          <div className="text-sm text-tertiary">
            © 2024 Réseau Plomb. Tous droits réservés.
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="text-secondary hover:text-primary transition-colors">
              Mentions légales
            </a>
            <a href="#" className="text-secondary hover:text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
