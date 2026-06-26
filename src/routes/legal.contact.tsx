import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { BIZ } from "@/components/legal/LegalPage";
import { getStorefrontCms, type StorefrontCms } from "@/lib/products";

export const Route = createFileRoute("/legal/contact")({
  loader: async () => {
    const cms = await getStorefrontCms();
    return { cms };
  },
  head: () => ({
    meta: [
      { title: "Contact Us — TECHLAB" },
      {
        name: "description",
        content: "Get in touch with TECHLAB support via WhatsApp, contact form, email, or visit our shop location.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { cms } = Route.useLoaderData() as { cms: StorefrontCms };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      try {
        const existingStr = localStorage.getItem("techlab_contact_messages");
        const existing = existingStr ? JSON.parse(existingStr) : [];
        const newMessage = {
          id: `MSG-${Math.floor(100000 + Math.random() * 900000)}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          date: new Date().toISOString(),
          status: "unread",
        };
        localStorage.setItem("techlab_contact_messages", JSON.stringify([newMessage, ...existing]));
      } catch (err) {
        console.error("Failed to save message", err);
      }
    }
    setSubmitted(true);
  };

  const whatsappUrl = `https://wa.me/${cms.whatsapp_chat_phone || "919876543210"}?text=${encodeURIComponent(cms.whatsapp_chat_message || "Hi TECHLAB Support, I have an inquiry regarding your products.")}`;

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            <Link to="/" className="hover:text-primary">Home</Link> / Contact Us
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary max-w-2xl">
            Contact Us
          </h1>
          <p className="text-lg font-medium text-on-surface-variant mt-4 max-w-2xl leading-relaxed">
            We're a small, dedicated team and we read every single message. Connect with us instantly via WhatsApp, fill out our quick form, or visit our store.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column: Direct Contact & Form */}
          <div className="space-y-12">
            {/* WhatsApp Contact Card */}
            <div className="bg-surface-container-lowest border-2 border-primary/40 p-8 rounded shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl">
                Instant Response
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-3xl">forum</span>
                WhatsApp Live Support
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                Need immediate assistance or want to discuss specific custom builds? Chat directly with our hardware specialists over WhatsApp.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm px-6 py-3 rounded shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-xl">chat</span>
                Start WhatsApp Chat
              </a>
            </div>

            {/* Basic Contact Form */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-8 rounded shadow-sm">
              <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mail</span>
                Send Us a Message
              </h2>
              <p className="text-on-surface-variant text-xs mb-6">
                Fill out this quick form and our support staff will get back to you within 24 hours.
              </p>

              {submitted ? (
                <div className="bg-surface-container-low border border-primary/30 p-6 rounded text-center space-y-3">
                  <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
                  <h3 className="font-bold text-primary text-lg">Thank you for reaching out!</h3>
                  <p className="text-xs text-on-surface-variant">
                    We have received your message and will get back to you at <strong>{formData.email}</strong> very soon.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
                    }}
                    className="mt-4 inline-block bg-primary text-on-primary text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary shadow-2xs rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary shadow-2xs rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary shadow-2xs rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Subject</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Inquiry about custom order"
                        className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary shadow-2xs rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help you today?"
                      className="w-full bg-white border border-outline-variant/40 p-3 text-sm text-primary focus:outline-none focus:border-primary shadow-2xs rounded resize-y"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary font-bold text-xs uppercase tracking-widest py-3 rounded shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    Submit Message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Google Map & Company Details */}
          <div className="space-y-8">
            {/* Google Map Embed */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-8 rounded shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Our Shop Location
              </h2>
              <p className="text-on-surface-variant text-xs">
                Visit our experience center to inspect our tactical hardware in person.
              </p>
              <div className="w-full aspect-[16/11] rounded overflow-hidden border border-outline-variant/30 shadow-2xs">
                <iframe
                  title="TECHLAB Store Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.792015099317!2d72.83311891147576!3d19.0728445520141!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c91131105373%3A0xb331d044f15d78d2!2sBandra%20Kurla%20Complex%2C%20Bandra%20East%2C%20Mumbai%2C%20Maharashtra%20400051!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* Official Business Details */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-8 rounded shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">support_agent</span>
                  Customer Support
                </h3>
                <p className="text-xs text-on-surface-variant space-y-1 leading-relaxed">
                  <span className="block"><strong>Email:</strong> <a href={`mailto:${cms.biz_email || BIZ.email}`} className="text-primary hover:underline">{cms.biz_email || BIZ.email}</a></span>
                  <span className="block"><strong>Phone:</strong> {cms.biz_phone || BIZ.phone}</span>
                  <span className="block"><strong>Operating Hours:</strong> {cms.biz_hours || BIZ.hours}</span>
                </p>
              </div>

              <hr className="border-outline-variant/30" />

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">corporate_fare</span>
                  Registered Office
                </h3>
                <p className="text-xs text-on-surface-variant space-y-1 leading-relaxed">
                  <span className="block font-medium text-on-surface">{cms.biz_legal_name || BIZ.legalName}</span>
                  <span className="block">{cms.biz_address || BIZ.address}</span>
                  <span className="block"><strong>GSTIN:</strong> {cms.biz_gstin || BIZ.gstin}</span>
                </p>
              </div>

              <hr className="border-outline-variant/30" />

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">gavel</span>
                  Grievance Officer
                </h3>
                <p className="text-xs text-on-surface-variant space-y-1 leading-relaxed mb-2">
                  As required under Rule 5(9) of the IT Rules, 2011 and the Consumer Protection (E-Commerce) Rules, 2020:
                </p>
                <p className="text-xs text-on-surface-variant space-y-1 leading-relaxed">
                  <span className="block"><strong>Name:</strong> {cms.biz_grievance_officer || BIZ.grievanceOfficer}</span>
                  <span className="block"><strong>Email:</strong> <a href={`mailto:${cms.biz_email || BIZ.email}`} className="text-primary hover:underline">{cms.biz_email || BIZ.email}</a></span>
                  <span className="block"><strong>Phone:</strong> {cms.biz_phone || BIZ.phone}</span>
                </p>
                <p className="text-[11px] text-on-surface-variant/80 mt-3 italic">
                  We acknowledge complaints within 48 hours and resolve them within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
