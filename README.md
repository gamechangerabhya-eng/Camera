# Portrait Studio Stable
This emergency stability build removes the second Pose Landmarker pipeline that caused severe over-masking and browser stalls. It uses one GPU person segmenter, throttles inference, provides Portrait and Full-body profiles, and applies a conservative boundary only in Portrait mode.
