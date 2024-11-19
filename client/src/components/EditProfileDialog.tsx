import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface Availability {
  [day: string]: string;
}

interface Profile {
  name: string;
  role: 'tutor' | 'student';
  subjects?: string[];
  preferredSubjects?: string[];
  location?: string;
  availability?: Availability;
  learningGoals?: string;
}

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (editedProfile: Profile) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [editedProfile, setEditedProfile] = useState<Profile>({} as Profile);

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectsChange = (value: string) => {
    setEditedProfile(prev => ({ ...prev, subjects: value.split(',').map(s => s.trim()) }));
  };

  const handleAvailabilityChange = (day: string, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      availability: { ...(prev.availability || {}), [day]: value }
    }));
  };

  const handleSave = () => {
    onSave(editedProfile);
    onClose();
  };

  if (!profile) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={editedProfile.name || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          {editedProfile.role === 'tutor' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjects" className="text-right">
                  Subjects
                </Label>
                <Input
                  id="subjects"
                  name="subjects"
                  value={editedProfile.subjects?.join(', ') || ''}
                  onChange={(e) => handleSubjectsChange(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={editedProfile.location || ''}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">Availability</Label>
                <div className="col-span-3 space-y-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Label htmlFor={`availability-${day}`} className="w-20">{day}</Label>
                      <Input
                        id={`availability-${day}`}
                        value={editedProfile.availability?.[day] || ''}
                        onChange={(e) => handleAvailabilityChange(day, e.target.value)}
                        placeholder="e.g. 9AM-5PM"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {editedProfile.role === 'student' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="preferredSubjects" className="text-right">
                  Preferred Subjects
                </Label>
                <Input
                  id="preferredSubjects"
                  name="preferredSubjects"
                  value={editedProfile.preferredSubjects?.join(', ') || ''}
                  onChange={(e) => handleSubjectsChange(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="learningGoals" className="text-right">
                  Learning Goals
                </Label>
                <Textarea
                  id="learningGoals"
                  name="learningGoals"
                  value={editedProfile.learningGoals || ''}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;